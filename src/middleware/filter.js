export default (req, res, next) => {
  if (req.query?.filter) {
    try {
      const filter = JSON.parse(req.query.filter);
      const mongoFilter = {};
      
      for (let i = 0; i < filter.length; i++) {
        switch (filter[i].type) {
          case "checkbox":
            let existActiveChip = false;
            const values = [];
            
            for (let j = 0; j < filter[i].chip.length; j++) {
              if (filter[i].chip[j].defaultValue) {
                existActiveChip = true;
                values.push(filter[i].chip[j].value);
              }
            }

            if (existActiveChip) {
              mongoFilter[filter[i].column] = { $in: values };
            }
            break;

          case "text":
            if (filter[i].value && filter[i].value.trim()) {
              mongoFilter[filter[i].column] = {
                $regex: filter[i].value,
                $options: 'i'
              };
            }
            break;

          case "select":
            if (filter[i].value) {
              mongoFilter[filter[i].column] = filter[i].value;
            }
            break;

          case "date_range":
            if (filter[i].startDate || filter[i].endDate) {
              const dateFilter = {};
              if (filter[i].startDate) {
                dateFilter.$gte = new Date(filter[i].startDate);
              }
              if (filter[i].endDate) {
                dateFilter.$lte = new Date(filter[i].endDate);
              }
              mongoFilter[filter[i].column] = dateFilter;
            }
            break;

          case "number_range":
            if (filter[i].min !== undefined || filter[i].max !== undefined) {
              const numberFilter = {};
              if (filter[i].min !== undefined) {
                numberFilter.$gte = Number(filter[i].min);
              }
              if (filter[i].max !== undefined) {
                numberFilter.$lte = Number(filter[i].max);
              }
              mongoFilter[filter[i].column] = numberFilter;
            }
            break;

          default:
            break;
        }
      }
      
      req.query.mongoFilter = mongoFilter;
    } catch (error) {
      console.error('Filter parsing error:', error);
      req.query.mongoFilter = {};
    }
  } else {
    req.query.mongoFilter = {};
  }

  next();
};
