const mongoose = require('mongoose');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

/**
 * Get system health status
 */
const getSystemHealth = async () => {
    const health = {
        timestamp: new Date(),
        status: 'healthy',
        checks: {}
    };

    // Database check
    try {
        const dbState = mongoose.connection.readyState;
        health.checks.database = {
            status: dbState === 1 ? 'connected' : 'disconnected',
            state: dbState,
            healthy: dbState === 1
        };
    } catch (error) {
        health.checks.database = {
            status: 'error',
            healthy: false,
            error: error.message
        };
        health.status = 'unhealthy';
    }

    // Server metrics
    try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);

        const cpus = os.cpus();
        const loadAvg = os.loadavg();

        health.checks.server = {
            healthy: memUsagePercent < 90,
            memory: {
                total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                used: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                usagePercent: `${memUsagePercent}%`
            },
            cpu: {
                cores: cpus.length,
                model: cpus[0].model,
                loadAverage: loadAvg.map(l => l.toFixed(2))
            },
            uptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
            platform: os.platform(),
            nodeVersion: process.version
        };

        if (memUsagePercent > 90) {
            health.status = 'warning';
        }
    } catch (error) {
        health.checks.server = {
            status: 'error',
            healthy: false,
            error: error.message
        };
        health.status = 'unhealthy';
    }

    // AI Service check (basic)
    try {
        const aiProvider = process.env.ACTIVE_AI_PROVIDER || 'bytez';
        const hasApiKey = process.env.BYTEZ_API_KEY || process.env.GEMINI_API_KEY;
        
        health.checks.ai = {
            healthy: !!hasApiKey,
            provider: aiProvider,
            configured: !!hasApiKey
        };

        if (!hasApiKey) {
            health.status = 'warning';
        }
    } catch (error) {
        health.checks.ai = {
            status: 'error',
            healthy: false,
            error: error.message
        };
    }

    return health;
};

/**
 * Create database backup
 */
const createBackup = async () => {
    try {
        const backupDir = path.join(__dirname, '../backups');
        
        // Create backups directory if it doesn't exist
        try {
            await fs.access(backupDir);
        } catch {
            await fs.mkdir(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `backup-${timestamp}`);

        // Get MongoDB connection string
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found in environment variables');
        }

        // Extract database name from URI
        const dbName = mongoUri.split('/').pop().split('?')[0];

        // Use mongodump command
        const command = `mongodump --uri="${mongoUri}" --out="${backupPath}"`;
        
        await execAsync(command);

        // Get backup size
        const stats = await fs.stat(backupPath);

        return {
            success: true,
            backupPath,
            timestamp: new Date(),
            size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
            database: dbName
        };
    } catch (error) {
        console.error('Backup failed:', error);
        return {
            success: false,
            error: error.message,
            note: 'Make sure mongodump is installed on your system'
        };
    }
};

/**
 * Export data to JSON
 */
const exportDataToJSON = async (modelName) => {
    try {
        const Model = mongoose.model(modelName);
        const data = await Model.find().lean();

        const exportDir = path.join(__dirname, '../exports');
        
        try {
            await fs.access(exportDir);
        } catch {
            await fs.mkdir(exportDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${modelName.toLowerCase()}-${timestamp}.json`;
        const filepath = path.join(exportDir, filename);

        await fs.writeFile(filepath, JSON.stringify(data, null, 2));

        const stats = await fs.stat(filepath);

        return {
            success: true,
            filepath,
            filename,
            recordCount: data.length,
            size: `${(stats.size / 1024).toFixed(2)} KB`,
            timestamp: new Date()
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * List available backups
 */
const listBackups = async () => {
    try {
        const backupDir = path.join(__dirname, '../backups');
        
        try {
            await fs.access(backupDir);
        } catch {
            return [];
        }

        const files = await fs.readdir(backupDir);
        
        const backups = await Promise.all(
            files.map(async (file) => {
                const filepath = path.join(backupDir, file);
                const stats = await fs.stat(filepath);
                
                return {
                    name: file,
                    path: filepath,
                    size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
                    created: stats.birthtime
                };
            })
        );

        return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
        console.error('Failed to list backups:', error);
        return [];
    }
};

module.exports = {
    getSystemHealth,
    createBackup,
    exportDataToJSON,
    listBackups
};
