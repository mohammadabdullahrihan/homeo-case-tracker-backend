const Case = require('../models/Case');

const caseRepository = {
  create: async (data) => {
    const newCase = new Case(data);
    return newCase.save();
  },

  findById: async (id, userId) => {
    const query = { _id: id };
    if (userId) query.user = userId;
    return Case.findOne(query);
  },

  findAll: async (userId, options = {}) => {
    const { search, filter, sort = { createdAt: -1 }, select } = options;
    let query = { user: userId };

    if (search) {
      query.patientName = { $regex: search, $options: 'i' };
    }
    if (filter === 'pending') {
      query.summary = { $in: ['', null] };
    }

    let mongoQuery = Case.find(query);
    if (select) mongoQuery = mongoQuery.select(select);
    return mongoQuery.sort(sort);
  },

  update: async (id, userId, updates) => {
    const query = { _id: id };
    if (userId) query.user = userId;
    return Case.findOneAndUpdate(query, updates, { new: true });
  },

  delete: async (id, userId) => {
    const query = { _id: id };
    if (userId) query.user = userId;
    return Case.findOneAndDelete(query);
  },

  count: async (filter = {}) => {
    return Case.countDocuments(filter);
  }
};

module.exports = caseRepository;
