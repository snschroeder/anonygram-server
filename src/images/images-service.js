const { getDistanceFromLatLonInKm } = require('../utils/location-util');

const ImagesService = {
  getSubmissions: (db, lat, lon, sort = 'new', page = null, distance = 20) => {
    const sortBy = sort === 'new' ? 'create_timestamp' : 'karma_total';
    const PAGINATION_VALUE = 10;

    return db('submission')
      .select('*')
      .orderBy(sortBy, 'DESC')
      .then((results) => {
        const filtered = [];
        results.forEach((submission) => {
          // select all from submission where the computed value of each
          // row's latitude and longitude is less than 20
          let radius = getDistanceFromLatLonInKm(
            parseInt(lat),
            parseInt(lon),
            parseInt(submission.latitude),
            parseInt(submission.longitude)
          );
          if (radius < distance) {
            filtered.push(submission);
          }
        });
        return filtered;
      })
      .then((filteredRes) => {
        // if the page arg is set we want to then only return a limited
        // set of the overall qualifying submissions
        if (page !== null) {
          const paginatedRes = filteredRes.slice(
            (page - 1) * PAGINATION_VALUE,
            PAGINATION_VALUE * page
          );
          return paginatedRes;
        }
        return filteredRes;
      });
  },

  getSingleSubmission: (db, id) => {
    return db('submission')
      .select('*')
      .where({ id })
      .first();
  },

  updateSingleSubmission: (db, id, updateFields) => {
    return db('submission')
      .where({ id })
      .update(updateFields)
      .then(() => ImagesService.getSingleSubmission(db, id));
  },

  createSubmission(db, submission) {
    return db
      .insert(submission)
      .into('submission')
      .returning('*')
      .then((rows) => {
        return rows[0];
      });
  },

  deleteSubmission(db, id) {
    return db('submission')
      .where({ id })
      .del();
  },
};

module.exports = ImagesService;
