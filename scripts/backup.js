const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { exec } = require('child_process');
require('dotenv').config();

const backupDatabase = async () => {
    const date = new Date().toISOString().split('T')[0];
    const backupPath = path.join(process.env.BACKUP_PATH || './backups', date);
    
    // יצירת תיקיית גיבוי
    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
    }

    // גיבוי מסד הנתונים
    const cmd = `mongodump --uri="${process.env.MONGODB_URI}" --out="${backupPath}"`;
    
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error('Backup error:', error);
            return;
        }
        console.log('Database backup completed successfully');
        
        // מחיקת גיבויים ישנים
        cleanOldBackups();
    });
};

const cleanOldBackups = () => {
    const retentionDays = process.env.BACKUP_RETENTION_DAYS || 30;
    const backupDir = process.env.BACKUP_PATH || './backups';
    
    fs.readdir(backupDir, (err, files) => {
        if (err) {
            console.error('Error reading backup directory:', err);
            return;
        }

        const now = new Date();
        files.forEach(file => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            const daysOld = (now - stats.mtime) / (1000 * 60 * 60 * 24);
            
            if (daysOld > retentionDays) {
                fs.rmSync(filePath, { recursive: true, force: true });
                console.log(`Deleted old backup: ${file}`);
            }
        });
    });
};

// הרצת גיבוי
backupDatabase().catch(console.error);