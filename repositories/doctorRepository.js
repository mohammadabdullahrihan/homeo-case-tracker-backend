const User = require('../models/User');

const doctorRepository = {
  findAllDoctors: async () => {
    return User.find({ role: 'doctor' }).sort({ createdAt: -1 });
  },

  findById: async (id) => {
    return User.findById(id);
  },

  update: async (id, data) => {
    return User.findByIdAndUpdate(id, data, { new: true });
  },

  findDoctorsWithStatus: async (status) => {
    return User.find({ role: 'doctor', accountStatus: status });
  },

  countDoctors: async (filter = {}) => {
    return User.countDocuments({ role: 'doctor', ...filter });
  },
  
  aggregateMonthlyGrowth: async (sixMonthsAgo) => {
    return User.aggregate([
      {
        $match: {
          role: 'doctor',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
  }
};

module.exports = doctorRepository;
