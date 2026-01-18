const FormConfig = require('../models/FormConfig');

// Get the active configuration
exports.getConfig = async (req, res) => {
    console.log('GET CONFIG CALLED');
    try {
        const userId = req.user ? req.user.id : null;

        // 1. Try to find user-specific config
        let config = null;
        if (userId) {
            config = await FormConfig.findOne({ user: userId, isActive: true }).sort({ version: -1 });
        }

        // 2. If no user config, find global config
        if (!config) {
            config = await FormConfig.findOne({ user: null, isActive: true }).sort({ version: -1 });
        }

        // Return null or empty if no config, frontend can handle or we can seed default
        if (!config) {
            return res.status(200).json({ success: true, config: null, message: "No configuration found" });
        }

        // Add metadata to tell frontend if this is global or custom
        const configData = config.toObject();
        configData.isGlobal = !config.user;

        res.status(200).json({ success: true, config: configData });
    } catch (error) {
        console.error('Error in getConfig:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update/Create configuration
exports.updateConfig = async (req, res) => {
    try {
        const { sections } = req.body;

        // We always create a new version to keep history (optional strategy)
        // Or simply update the single document for simplicity

        // Strategy: Find existing and update or create new
        // For MVP, lets just update the existing "active" one or create if none.

        const userId = req.user.id;
        const userRole = req.user.role;

        // Determine if we are updating Global (Super Admin only checks?)
        // For now, assume any update from Dashboard -> User specific config.
        // If Super Admin wants to update Global, we need a flag?
        // Let's keep it simple: All updates via this route create/update USER config.
        // Unless we add a specific admin route for global config.

        // Update: User always modifies THEIR config.
        // If they don't have one, we create one.
        
        // Check if user already has a config
        let config = await FormConfig.findOne({ user: userId, isActive: true });

        if (config) {
            config.sections = sections;
            config.version = config.version + 1;
            config.updatedAt = Date.now();
            await config.save();
        } else {
            // Create new personal config
            config = await FormConfig.create({
                user: userId,
                sections,
                version: 1,
                isActive: true
            });
        }

        res.status(200).json({ success: true, config });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Seed default config if requested (helper)
exports.seedConfig = async (req, res) => {
    try {
        // Only seed if empty
        const count = await FormConfig.countDocuments();
        if (count > 0) return res.status(400).json({ message: "Config already exists" });

        const defaultSections = [
            {
                id: 'basic-data',
                title: 'মৌলিক তথ্য (Basic Data)',
                fields: [
                    { id: 'name', label: 'রোগীর নাম', type: 'text', required: true },
                    { id: 'age', label: 'বয়স', type: 'text', required: true },
                    { id: 'sex', label: 'লিঙ্গ', type: 'mcq', renderAs: 'buttons', required: true, options: ['পুরুষ', 'মহিলা', 'শিশু'] },
                ]
            },
            {
                id: 'chief-complaints',
                title: 'প্রধান অভিযোগ (Chief Complaints)',
                fields: [
                    { id: 'complaint', label: 'প্রধান সমস্যা ও তার বিবরণ', type: 'textarea', required: true }
                ]
            },
            {
                id: 'mental-symptoms',
                title: 'মানসিক লক্ষণ (Mental Symptoms)',
                fields: [
                    { id: 'mind', label: 'মানসিক অবস্থা, রাগ, ভয় বা দুশ্চিন্তা', type: 'textarea' }
                ]
            },
            {
                id: 'physical-generals',
                title: 'শারীরিক সাধারণ লক্ষণ (Physical Generals)',
                fields: [
                    { id: 'appetite', label: 'ক্ষুধা, তৃষ্ণা ও খাবারের প্রতি ইচ্ছা/অনিচ্ছা', type: 'textarea' },
                    { id: 'thermal', label: 'গরমকাতরতা বা শীতকাতরতা (Thermal Relations)', type: 'text' }
                ]
            },
            {
                id: 'additional-info',
                title: 'অন্যান্য তথ্য (Additional Info)',
                fields: [
                    { id: 'others', label: 'অন্য কোনো গুরুত্বপূর্ণ তথ্য বা পর্যবেক্ষণ', type: 'textarea' }
                ]
            }
        ];

        const config = await FormConfig.create({ sections: defaultSections, user: null });
        res.status(201).json({ success: true, config });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
