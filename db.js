import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'marks.sqlite',
});

export const Bearing = sequelize.define('Bearing', {
    Name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Model attributes are defined here
    latitude: {
        type: DataTypes.NUMBER,
        allowNull: false,
    },
    longitude: {
        type: DataTypes.NUMBER,
        allowNull: false,
    },
});

export const Ride = sequelize.define('Ride', {
    Name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Model attributes are defined here
    latitudeStart: {
        type: DataTypes.NUMBER,
        allowNull: false,
    },
    longitudeStart: {
        type: DataTypes.NUMBER,
        allowNull: false,
    },
    latitudeEnd: {
        type: DataTypes.NUMBER,
        allowNull: true,
    },
    longitudeEnd: {
        type: DataTypes.NUMBER,
        allowNull: true,
    },
    rideTime: {
        type: DataTypes.NUMBER,
        allowNull: true,
    },
});

if (process.argv[2] === '--create') {
    sequelize.sync({ force: true }); // create table
}
// need to create test pack
// `sequelize.define` also returns the model
