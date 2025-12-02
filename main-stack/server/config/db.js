const knex = require("knex")({
	client: "mysql2",
	connection: {
		host: process.env.DB_HOST_SQL,
		user: process.env.DB_USER_SQL,
		password: process.env.DB_PASSWORD_SQL,
		database: process.env.DB_NAME_SQL,
	},
	pool: { max: 10 },
});

module.exports = knex;
