require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
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

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');
    
    await sequelize.sync({ alter: false });  // Don't modify existing tables
    console.log('✅ Tables synchronized');

    const email = 'admin@gmail.com';
    const password = 'admin123';

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const [admin, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        name: 'Super Admin',
        email,
        password: hashedPassword,  // ✅ Store hashed password
        role: 'admin'
      }
    });

    console.log(created ? '✅ Admin created' : '⚠️ Admin already exists');
    console.log(admin.toJSON());
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await sequelize.close();
  }
}

createAdmin();
