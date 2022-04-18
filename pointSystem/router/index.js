exports.setup = function (app, mongoClient) {

	const user = require(__dirname + '../../services/user')
	const point = require(__dirname + '../../services/point')


	//users
	app.route('/api/users')
		.get((req, res, next) => {
			res.locals.mongo = mongoClient;
			user.getUsers(req, res, next);
		});

	app.route('/api/users')
		.post((req, res, next) => {
			res.locals.mongo = mongoClient;
			user.postUser(req, res, next);
		});


	app.route('/api/users/:userID')
		.get((req, res, next) => {
			res.locals.mongo = mongoClient;
			user.getUser(req, res, next);
		})
		.put((req, res, next) => {
			res.locals.mongo = mongoClient;
			user.putUser(req, res, next);
		})
		.delete((req, res, next) => {
			res.locals.mongo = mongoClient;
			user.deleteUser(req, res, next);
		});

	//list points
	app.route('/api/points')
		.get((req, res, next) => {
			res.locals.mongo = mongoClient;
			point.getPoints(req, res, next);
		});


	//point detail
	app.route('/api/points/:userID')
		.get((req, res, next) => {
			res.locals.mongo = mongoClient;
			point.getPoint(req, res, next);
		});

	//update Point
	app.route('/api/points/:userID')
		.patch((req, res, next) => {
			res.locals.mongo = mongoClient;
			point.patchPoint(req, res, next);
		});


	//health check
	app.route('/env')
		.get((req,res, next) => {

			res.send({
				env: process.env.ENV || 'unknown'
			})

		});

	//catch all
	app.route('*')
		.get((req, res, next) => {
			res.status(404).send({});
		});

}
