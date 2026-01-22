const doctorRepository = require('../repositories/doctorRepository');
const caseRepository = require('../repositories/caseRepository');

const analyticsService = {
  getSystemStats: async () => {
    // 1. Doctor Stats
    const totalDoctors = await doctorRepository.countDoctors();
    const pendingDoctors = await doctorRepository.countDoctors({ accountStatus: 'pending' });
    const approvedDoctors = await doctorRepository.countDoctors({ accountStatus: 'approved' });
    
    const activeTrial = await doctorRepository.countDoctors({ 
        'subscription.plan': 'trial', 
        'subscription.status': 'active' 
    });
    
    // 2. Financial Stats (Revenue)
    const paidSubscribers = await doctorRepository.countDoctors({ 
        'subscription.plan': { $in: ['monthly', 'yearly', 'lifetime'] }, 
        'subscription.status': 'active' 
    });

    const monthlySubs = await doctorRepository.countDoctors({ 'subscription.plan': 'monthly', 'subscription.status': 'active' });
    const yearlySubs = await doctorRepository.countDoctors({ 'subscription.plan': 'yearly', 'subscription.status': 'active' });
    const lifetimeSubs = await doctorRepository.countDoctors({ 'subscription.plan': 'lifetime', 'subscription.status': 'active' });
    
    // Revenue Calculation Formula
    const totalRevenue = (monthlySubs * 500) + (yearlySubs * 5000) + (lifetimeSubs * 15000);

    // 3. Case Stats
    const totalCases = await caseRepository.countCases();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCases = await caseRepository.countCases({ createdAt: { $gte: startOfToday } });

    // 4. Monthly Growth
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyGrowth = await doctorRepository.aggregateMonthlyGrowth(sixMonthsAgo);

    return {
        overview: {
            totalDoctors,
            pendingDoctors,
            approvedDoctors,
            activeTrial,
            paidSubscribers,
            totalCases,
            todayCases,
            totalRevenue,
        },
        monthlyGrowth,
    };
  }
};

module.exports = analyticsService;
