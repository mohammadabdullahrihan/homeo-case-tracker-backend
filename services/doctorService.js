const doctorRepository = require('../repositories/doctorRepository');
const caseRepository = require('../repositories/caseRepository');
const { logActivity } = require('../utils/activityLogger');
// const bcrypt = require('bcryptjs'); // Will use if needed, but currently logic is simple

const doctorService = {
  getAllDoctorsWithStats: async () => {
    const doctors = await doctorRepository.findAllDoctors();
    
    // Enrich with stats
    // Note: Promise.all mapping is good, but for very large datasets this might need optimization (aggregation)
    // Keeping it as is for now to match logic
    const doctorsWithStats = await Promise.all(
      doctors.map(async (doctor) => {
        const caseCount = await caseRepository.countCases({ user: doctor._id });
        const lastCase = await caseRepository.findLastCaseByDoctor(doctor._id);

        return {
          ...doctor.toObject(),
          stats: {
            totalCases: caseCount,
            lastCaseDate: lastCase?.createdAt || null,
          },
        };
      })
    );
    return doctorsWithStats;
  },

  updateStatus: async (id, status, adminUser) => {
    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status value');
    }

    const doctor = await doctorRepository.findById(id);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    doctor.accountStatus = status;

    // Initialize subscription if missing
    if (!doctor.subscription) {
      doctor.subscription = {
        plan: 'trial',
        status: 'inactive',
        trialEndsAt: null,
        subscriptionEndsAt: null
      };
    }

    // Logic: Approve -> Start Trial
    if (status === 'approved' && doctor.subscription.plan === 'trial') {
      const trialDays = 30;
      doctor.subscription.status = 'active';
      doctor.subscription.trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
      doctor.subscription.subscriptionEndsAt = new Date(
         Date.now() + trialDays * 24 * 60 * 60 * 1000
      );
    }

    // Logic: Reject -> Cancel Subscription
    if (status === 'rejected' && doctor.subscription) {
      doctor.subscription.status = 'cancelled';
    }

    await doctor.save();

    // Log Activity
    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        userRole: 'super_admin',
        action: status === 'approved' ? 'doctor_approved' : status === 'rejected' ? 'doctor_rejected' : 'doctor_suspended',
        targetUserId: id,
        details: `Doctor ${doctor.firstName} ${doctor.lastName} status changed to ${status}`
      });
    }

    return doctor;
  },

  updateSubscription: async (id, plan, duration, adminUser) => {
      const doctor = await doctorRepository.findById(id);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      if (!doctor.subscription) {
        doctor.subscription = {
            plan: 'trial',
            status: 'inactive',
            trialEndsAt: null,
            subscriptionEndsAt: null
        };
      }

      doctor.subscription.plan = plan;
      doctor.subscription.status = 'active';

      let durationDays = duration;
      if (!durationDays) {
          if (plan === 'trial') durationDays = 30;
          else if (plan === 'monthly') durationDays = 30;
          else if (plan === 'yearly') durationDays = 365;
          else if (plan === 'lifetime') durationDays = 36500;
          else durationDays = 30;
      }
      
      doctor.subscription.subscriptionEndsAt = new Date(
          Date.now() + durationDays * 24 * 60 * 60 * 1000
      );

      await doctor.save();

      if (adminUser) {
          await logActivity({
              userId: adminUser.id,
              userRole: 'super_admin',
              action: 'subscription_updated',
              targetUserId: id,
              details: `Subscription updated to ${plan} for ${doctor.firstName} ${doctor.lastName}`,
              metadata: { plan, duration: durationDays }
          });
      }

      return doctor;
  },

  resetPassword: async (id, newPassword, adminUser) => {
    const doctor = await doctorRepository.findById(id);
    if (!doctor) throw new Error('Doctor not found');

    const bcrypt = require('bcryptjs');
    doctor.password = await bcrypt.hash(newPassword, 10);
    await doctor.save();

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        userRole: 'super_admin',
        action: 'password_reset',
        targetUserId: id,
        details: `Password reset for ${doctor.firstName} ${doctor.lastName}`,
      });
    }

    return doctor;
  }
};

module.exports = doctorService;
