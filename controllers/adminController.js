const User = require('../models/User');

exports.getDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, count: doctors.length, data: doctors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.updateDoctorStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'rejected' or 'pending'

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const doctor = await User.findById(id);
        
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const previousStatus = doctor.accountStatus;
        doctor.accountStatus = status;

        // If approving from non-approved state, start trial
        if (status === 'approved' && previousStatus !== 'approved') {
            const now = new Date();
            const trialEnd = new Date(now);
            trialEnd.setDate(trialEnd.getDate() + 30); // 30 Days Trial

            doctor.subscription = {
                plan: 'trial',
                status: 'active',
                trialEndsAt: trialEnd,
                subscriptionEndsAt: trialEnd // Initially trial end is sub end
            };
        } else if (status === 'rejected') {
             doctor.subscription.status = 'cancelled';
        }

        await doctor.save();

        res.json({ success: true, message: `Doctor ${status} successfully`, data: doctor });

    } catch (error) {
         res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
