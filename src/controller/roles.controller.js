const { Roles } = require("../models");

//----------------<< Create Role >>----------------
export async function createRole(req, res, next) {
  try {
    const newRole = new Roles(req.body);
    await newRole.save();
    res.status(201).send({
      status: "success",
      message: "Role created successfully",
      data: newRole,
    });
  } catch (error) {
    next(error);
  }
}

//----------------<< Get All Roles >>----------------
export async function getRoles(req, res, next) {
  try {
    let limit = req?.query?.limit ? Number(req.query.limit) : 10;
    let page = req?.query?.page ? Number(req.query.page) : 1;
    let skip = (page - 1) * limit;
    
    let order = req.query?.order === 'asc' ? 1 : -1;
    let orderBy = req.query?.orderBy || '_id';
    let sortObj = {};
    sortObj[orderBy] = order;

    let roles = await Roles.find({ deletedAt: null })
      .sort(sortObj)
      .skip(skip)
      .limit(limit);
      
    let dataCount = await Roles.countDocuments({ deletedAt: null });

    res.status(200).send({
      status: "success",
      count: dataCount,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
}

//-----------------<< Get Role By ID >>----------------
export async function getRoleById(req, res, next) {
  try {
    let role = await Roles.findOne({ 
      _id: req.params.id, 
      deletedAt: null 
    });
    if (!role) {
      return res.status(404).send({
        status: "error",
        message: "Role not found",
      });
    }
    res.status(200).send({
      status: "success",
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

//-----------------<< Update Role >>----------------
export async function updateRole(req, res, next) {
  try {
    const updatedRole = await Roles.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      req.body,
      { new: true }
    );
    if (!updatedRole) {
      return res.status(404).send({
        status: "error",
        message: "Role not found",
      });
    }
    res.status(200).send({
      status: "success",
      data: updatedRole,
    });
  } catch (error) {
    next(error);
  }
}

//-----------------<< Delete Role >>----------------
export async function deleteRole(req, res, next) {
  try {
    const deleted = await Roles.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!deleted) {
      return res.status(404).send({
        status: "error",
        message: "Role not found",
      });
    }
    res.status(200).send({
      status: "success",
      message: "Role deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

//===================================<<> Bulk Delete Api >>=========================
export async function bulkDelete(req, res) {
  try {
    let { ids } = req.body;
    await Roles.updateMany(
      { _id: { $in: ids } },
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
