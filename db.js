import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'marks.sqlite',
});

export const Bearing = sequelize.define(
    'Bearing',
    {
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
        bearing: {
            type: DataTypes.NUMBER,
            allowNull: false,
        },
    },
    {
        // Other model options go here
    }
);

// `sequelize.define` also returns the model
// sequelize.sync({ force: true }); // create table
