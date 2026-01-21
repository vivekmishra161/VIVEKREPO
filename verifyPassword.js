require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
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
        console.log('Password Hash Length:', admin.password ? admin.password.length : 0);
        console.log('Is bcrypt hash:', admin.password ? admin.password.startsWith('$2') : false);
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
