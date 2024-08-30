import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'marks.sqlite',
});

const User = sequelize.define(
    'Mark',
    {
        Name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Model attributes are defined here
        x: {
            type: DataTypes.NUMBER,
            allowNull: false,
        },
        y: {
            type: DataTypes.NUMBER,
            allowNull: false,
            // allowNull defaults to true
        },
    },
    {
        // Other model options go here
    }
);

// `sequelize.define` also returns the model
sequelize.sync({ force: true }); // create table
