const {
  Users,
  Roles,
  UserFcmTokens,
} = require("../models");
import { isMatch } from "../utils/password-hashing";
import { createAccesstoken } from "../utils/jwt";
import { sendMail } from "../services/send-mail";
import { SendOtp, sendMagicLink } from "../utils/send-otp";


//----------------------------------<< check user status >>-----------------------------------
export async function checkUserStatus(req, res, next) {
  try {
    const userData = await Users.findOne({ 
      _id: req.user.id, 
      deletedAt: null 
    })
    .populate('role', '_id name accessId')
    .select('-password -otp -accessToken');

    if (!userData) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    if (!userData.isVerified) {
      return res.status(200).send({
        status: "error",
        statusType: "notVerified",
        message: "Email not verified",
      });
    }


    userData.password = undefined; // Remove password from response
    userData.otp = undefined; // Remove OTP from response
    userData.accessToken = undefined // Remove accessToken from response

    return res.status(200).send({
      status: "success",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
}

//-----------------------------------<< LogIn >>-----------------------------
export async function logIn(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res.status(400).send({
        status: "error",
        message: "Email and password are required",
      });
    }

    const userData = await Users.findOne({
      email,
      deletedAt: null
    }).populate('role', '_id name accessId');

    if (!userData) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    const matched = await isMatch(
      password,
      userData.password
    );

    if (!matched) {
      return res.status(400).send({
        status: "error",
        message: "Invalid password",
      });
    }

    if (!userData.isVerified) {
      SendOtp({
        email: userData.email,
        name: userData.name,
        isOtp: true,
      });

      return res.status(401).send({
        status: "error",
        statusType: "notVerified",
        message: "Email not verified",
      });
    }

    userData.lastLogin = new Date();
    await userData.save();

    userData.password = undefined;
    userData.otp = undefined;
    userData.accessToken = undefined;

    return res.status(200).send({
      status: "success",
      message: "Login successful",
      accessToken: createAccesstoken(userData),
      data: userData
    });
  } catch (error) {
    next(error);
  }
}

//-----------------------<< Verify OTP >>-----------------------------------
export async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
      return res.status(400).send({
        status: "error",
        message: "Email and OTP are required",
      });
    }

    const userData = await Users.findOne({ 
      email: email.trim().toLowerCase(),
      deletedAt: null 
    })
    .populate('role', '_id name accessId')
    .select('_id otp name email phoneNumber role type isVerified');

    if (!userData) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    if (userData.otp !== otp.trim()) {
      return res.status(400).send({
        status: "error",
        message: "Invalid OTP",
      });
    }

    userData.isVerified = true;
    userData.otp = null;
    await userData.save();

    return res.status(200).send({
      status: "success",
      message: "OTP verified successfully",
      accessToken: createAccesstoken(userData),
      data: userData
    });
  } catch (error) {
    next(error);
  }
}

//----------------------<< change Password >>-----------------------------------
export async function changePassword(req, res, next) {
  const { newPassword, oldPassword } = req.body;
  const { id } = req.user;

  if (!newPassword) {
    return res.status(400).send({
      status: "error",
      message: "New password is required",
    });
  }

  try {
    const userData = await Users.findOne({ 
      _id: id, 
      deletedAt: null 
    })
    .select('_id name email password');

    if (!userData) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    let matched = await isMatch(
      oldPassword,
      userData.password
    );

    if (!matched) {
      return res.status(400).send({
        status: "error",
        message: "Current password is incorrect",
      });
    }
    userData.password = newPassword;
    await userData.save();
    const newInfo = {
      name: userData.name,
      email: userData.email,
      password: newPassword,
      changePassword: true,
    };

    const emailData = {
      to: userData.email,
      name: userData.name,
      subject: "Password Changed",
    };

    await sendMail(emailData, newInfo, "email-template.html");

    res.status(200).send({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
}

//----------------------<< Forget Password >>-----------------------------------
export async function forgetPassword(req, res, next) {
  let { newPassword, email, otp } = req.body;

  newPassword = newPassword.trim();
  email = email.trim();

  try {
    let userData = await Users.findOne({
      email: email,
      isVerified: true,
      deletedAt: null
    }).select('_id otp name email phoneNumber otpExpire');
    if (!userData) {
      return res
        .status(404)
        .send({ status: "error", message: "User does not exist" });
    }
    if (userData?.otp !== otp) {
      return res
        .status(404)
        .send({ status: "error", message: "Invalid OTP" });
    }
    if (userData.otpExpire < Math.floor(new Date().getTime() / 1000)) {
      res.status(400).send({
        status: "error",
        message: "OTP has expired",
      });
    } else {
      userData.otp = null;
      userData.otpExpire = null;
      userData.password = newPassword;
      await userData.save();
      const newInfo = {
        name: userData.name,
        email: userData.email,
        password: req.body.newPassword,
        changePassword: true,
      };

      const emailData = {
        to: userData.email,
        name: userData.name,
        subject: "Password Changed",
      };

      await sendMail(emailData, newInfo, "email-template.html");

      res.status(200).send({
        status: "success",
        message: "Password updated successfully",
      });
    }
  } catch (error) {
    next(error);
  }
}

//----------------------<< Create User >>-----------------------------------
export async function createUser(req, res, next) {
  try {
    const { name, email, password} = req.body;
    req.body.isVerified = true

    req.body.email = email.trim().toLowerCase();
    let createdUser;
    let existingUser = await Users.findOne({ 
      email: req.body.email 
    });

    if (existingUser && !existingUser.deletedAt) {
      return res.status(400).send({
        status: "error",
        message: "Email already in use.",
      });
    }

    if (existingUser && existingUser.deletedAt) {
      // Restore soft-deleted user
      Object.assign(existingUser, req.body);
      existingUser.deletedAt = null;
      await existingUser.save();
      createdUser = existingUser;
    } else {
      createdUser = new Users(req.body);
      await createdUser.save();
    }

    // const newInfo = {
    //   name: createdUser.name,
    //   email: createdUser.email,
    //   password: req.body.password,
    //   isRegistrationByAdmin: true,
    // };

    // const emailData = {
    //   to: createdUser.email,
    //   name: createdUser.name,
    //   subject: "Account Created",
    // };

    // await sendMail(emailData, newInfo, "email-template.html");

    return res.status(200).send({
      status: "success",
      message: "User created successfully",
      data: createdUser,
    });
  } catch (error) {
    next(error);
  }
}

//----------------------<< Update User >>-----------------------------------
export async function updateUser(req, res, next) {
  let userId =  req.params.id;
  if (req.file)
    req.body.picture = global.config.userPicturePath + req.file.filename;

  req.body.updatedBy = req.user.id;
  req.body.updatedAt = new Date();

  let dataToUpdate = {}
  if (req.body.name) dataToUpdate.name = req.body.name;
  if (req.body.phoneNumber) dataToUpdate.phoneNumber = req.body.phoneNumber;
  if (req.body.picture) dataToUpdate.picture = req.body.picture;
  if (req.body.dob) dataToUpdate.dob = req.body.dob;
  if (req.body.skills) dataToUpdate.skills = req.body.skills;
  if (req.body.seniority) dataToUpdate.seniority = req.body.seniority;
  if (req.body.department) dataToUpdate.department = req.body.department;
  if (req.body.employmentType) dataToUpdate.employmentType = req.body.employmentType;
  if (req.body.maxCapacity) dataToUpdate.maxCapacity = req.body.maxCapacity;

  try {
    let userData = await Users.findByIdAndUpdate(
      userId,
      { ...dataToUpdate },
      { new: true }
    );

    res.status(200).send({
      status: "success",
      message: "User updated successfully",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
}

//----------------------<< Update User Status >>-----------------------------------
export async function updateUserStatus(req, res, next) {
  try {
    let newUser = await Users.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.status(200).send({
      status: "success",
      message: `User ${req.body.status} successfully`,
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
}

//----------------------<< Delete User >>-----------------------------------
export async function deleteUser(req, res, next) {
  try {

    let userId = req.params.id;
    console.log("User ID:", userId);
    let data = await Users.findOneAndUpdate(
      {
        _id: userId,
      },
      { deletedAt: new Date() },
      { new: true }
    );

    if (data) {
      res.status(200).send({
        status: "success",
        message: "User deleted successfully",
        data: data,
      });
    } else {
      res.status(500).send({
        status: "error",
        message: "Internal server error",
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
}

//----------------------<< Get All Users >>-----------------------------------
export async function getUsers(req, res, next) {
  let {userType} = req.query;
  try {
    let limit = req?.query?.limit ? Number(req.query.limit) : 10;
    let page = req?.query?.page ? Number(req.query.page) : 1;
    let skip = (page - 1) * limit;
    
    let order = req.query?.order === 'asc' ? 1 : -1;
    let orderBy = req.query?.orderBy || '_id';
    let sortObj = {};
    sortObj[orderBy] = order;

    let filter = {
      deletedAt: null,
    };

    if (userType) {
      filter.type = userType;
    }

    if (req.query?.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phoneNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    let data = await Users.find(filter)
      .populate('role', 'name')
      .select('_id name email type role phoneNumber status picture dob skills seniority maxCapacity department employmentType')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);
      
    let count = await Users.countDocuments(filter);

    res.status(200).send({
      status: "success",
      count: count,
      data: data,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
}


//----------------------<< Get User By ID >>-----------------------------------
export async function getUserById(req, res, next) {
  try {
    let userId = req.params.id;
    
    let data = await Users.findOne({ 
      _id: userId, 
      deletedAt: null 
    })
    .populate('role', 'name')
    .select('_id name email phoneNumber role type picture status dob skills seniority maxCapacity department employmentType');
    if (!data) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
        data: data,
      });
    }
    res.status(200).send({
      status: "success",
      message: "",
      data,
    });
  } catch (error) {
    next(error);
  }
}

//===========================> (Send OTP) <=====================================//
export async function sendOTPFn(req, res, next) {
  try {
    const { email} = req.body;

    const user = await Users.findOne({
      email: email.trim().toLowerCase(),
      deletedAt: null
    }).select('_id email phoneNumber name');

    if (!user) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    const otpData = {
      email: user.email,
      name: user.name,
      isOtp: true,
    };

    await SendOtp(otpData);
    return res.status(200).send({
      status: "success",
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "error",
      message: "Internal server error",
    });
  }
}


//===================================<<> Bulk Delete Api >>=========================
export async function bulkDelete(req, res) {
  try {
    let { ids } = req.body;
    await Users.updateMany(
      {
        _id: { $in: ids },
      },
      { deletedAt: new Date() }
    );

    return res.status(200).send({
      status: "success",
      message: "Bulk delete successful",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "error",
      message: "Internal server error",
    });
  }
}

//========================<< Update FCM Token >>===================
export async function UpdateFcmToken(req, res) {
  try {
    const { fcmToken, deviceType } = req.body;

    if (!fcmToken) {
      return res.status(400).send({
        status: "error",
        message: "FCM token is required",
      });
    }

    await UserFcmTokens.findOneAndUpdate(
      { userId: req.user.id },
      { fcmToken, deviceType },
      { upsert: true, new: true }
    );

    return res.status(200).send({
      status: "success",
      message: "FCM token updated successfully",
    });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    return res.status(500).send({
      status: "error",
      message: error.message,
    });
  }
}