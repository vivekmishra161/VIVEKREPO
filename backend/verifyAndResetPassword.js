const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

// Get DATABASE_URL from environment or use the one from parent directory
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    console.log('Please make sure .env file exists in VIVEKREPO directory');
    process.exit(1);
}

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const User = sequelize.define('User', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING
}, {
    tableName: 'users',
    timestamps: true
});

async function verifyAndResetPassword() {
    try {
        console.log('🔗 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');

        const adminEmail = 'admin@gmail.com';
        const testPassword = 'admin123';

        // Find the admin user
        const admin = await User.findOne({
            where: { email: adminEmail, role: 'admin' }
        });

        if (!admin) {
            console.error('❌ Admin user not found');
            process.exit(1);
        }

        console.log('\n📋 Current Admin Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('ID:', admin.id);
        console.log('Name:', admin.name);
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('Password Hash:', admin.password);
        console.log('Password Hash Length:', admin.password.length);
        console.log('Is bcrypt hash:', admin.password.startsWith('$2'));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Test if current password matches
        console.log('\n🔐 Testing password "admin123"...');
        const isMatch = await bcrypt.compare(testPassword, admin.password);
        console.log('Password match result:', isMatch);

        if (isMatch) {
            console.log('\n✅ Password "admin123" is CORRECT!');
            console.log('The login should work. Check if there are any issues with the form submission.');
        } else {
            console.log('\n❌ Password "admin123" does NOT match the stored hash.');
            console.log('\n🔄 Resetting password to "admin123"...');
            
            const newHashedPassword = await bcrypt.hash(testPassword, 10);
            console.log('New hash generated:', newHashedPassword);
            
            await User.update(
                { password: newHashedPassword },
                { where: { email: adminEmail, role: 'admin' } }
            );
            
            console.log('\n✨ Password has been reset!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Email: admin@gmail.com');
            console.log('🔑 Password: admin123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            // Verify the new password works
            const updatedAdmin = await User.findOne({
                where: { email: adminEmail, role: 'admin' }
            });
            const verifyNew = await bcrypt.compare(testPassword, updatedAdmin.password);
            console.log('\n🔍 Verification of new password:', verifyNew ? '✅ SUCCESS' : '❌ FAILED');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

verifyAndResetPassword();
