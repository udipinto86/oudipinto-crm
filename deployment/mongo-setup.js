const mongoose = require('mongoose');
const User = require('../server/models/User');
const bcrypt = require('bcryptjs');

const initializeDB = async () => {
    try {
        // התחברות למסד הנתונים
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully');

        // יצירת משתמש אדמין ראשוני
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Admin123!', salt);
            
            await User.create({
                username: 'admin',
                password: hashedPassword,
                email: 'pintoudi@gmail.com',
                name: 'אודי פינטו',
                role: 'admin',
                isActive: true
            });
            
            console.log('Admin user created successfully');
        }

        // יצירת אינדקסים
        await mongoose.connection.db.collection('customers').createIndex({ idNumber: 1 }, { unique: true });
        await mongoose.connection.db.collection('policies').createIndex({ policyNumber: 1 }, { unique: true });
        
        console.log('Database initialization completed');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

initializeDB();