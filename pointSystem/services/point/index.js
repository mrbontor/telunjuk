const fs = require('fs');
const validate = require('../../libs/validateSchema');
const db = require('../../libs/db/mongoPromise');

const POST = JSON.parse(fs.readFileSync(__dirname + '/schema/post.json'))
const PATCH = JSON.parse(fs.readFileSync(__dirname + '/schema/put.json'))

const SUCCESS               = 200
const CREATED               = 201
const SUCCESS_NO_CONTENT    = 204
const BAD_REQUEST           = 400
const NOT_FOUND             = 404
const UNPROCESSABLE_ENTITY  = 422
const SERVER_ERROR          = 500

const USER_COLLECTION       = 'user'
const POINT_COLLECTION      = 'point'

module.exports = {

    getPoints: async (req, res) => {
        let results = {}
        try {
            let search = req.query.search || null
            let userID = req.query.userID || null

            //for autocomplete
            let query = {}
            let options = [{ $sort: { point: 1 } }]

            if (search !== null) {
                query.$or = [
                    { "$.userID.name": { $regex: search, $options: "i" } },
                    { "$.userID.username": { $regex: search, $options: "i" } }
                ]
            }

            let userIDs = []
            if(userID !== null) {
                userIDs = userID.replace(/\s/g, '').split(',');
            }
            if (userIDs.length > 0) {
                let ids = []
                userIDs.forEach(id => {
                    if(db.isValidId(id)) ids.push(id)
                });

                query._id = { $in: ids }
            }


            let find = await db.findAggregate(POINT_COLLECTION, [

                {
                    $lookup: {
                        from: USER_COLLECTION,
                        let: { userID: { "$toObjectId": "$userID" } },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$userID"] }}},
                            { $project: { _id: 1, username: 1, name: 1 } }
                        ],
                        as: "userID"
                    }
                },
                {
                    $unwind: {
                        path: "$userID",
                        preserveNullAndEmptyArrays: true
                    }
                },
                ...options,
                { $match : query },
            ])
            console.debug(`[GET][POINTS] >>>>> ${JSON.stringify(find)}`)
            if (find.length === 0) {
                results.message = `No data found`
                return res.status(404).send(results);
            }
            results.message= 'Successfully!'
            results.data = find
            res.send(results)
        } catch (e) {
            console.error(`[GET][POINTS] >>>>> ${JSON.stringify(e.stack)}`)
            results.message = 'Something went wrong, please try again!'
            res.status(SERVER_ERROR).send(results)
        }
    },

    getPoint: async (req, res) => {
        let results = {}

        let userID = req.params.userID || null
        if(!db.isValidId(userID)) {
            results.message = `No data found`
            return res.status(NOT_FOUND).send(results);
        }

        try {
            let find = await db.findAggregate(POINT_COLLECTION, [

                {
                    $lookup: {
                        from: USER_COLLECTION,
                        let: { userID: { "$toObjectId": "$userID" } },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$userID"] }}},
                            { $project: { _id: 1, username: 1, name: 1 } }
                        ],
                        as: "userID"
                    }
                },
                {
                    $unwind: {
                        path: "$userID",
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $limit: 1},
                { $match : {"userID._id": db.ObjectId(userID)} },
            ])
            console.debug(`[GET][POINTS] >>>>> ${JSON.stringify(find)}`)
            if (find.length === 0) {
                results.message = `No data found`
                return res.status(404).send(results);
            }

            results.message= 'Successfully!'
            results.data = find[0]
            res.send(results)
        } catch (e) {
            console.error(`[GET][POINTS] >>>>> ${JSON.stringify(e.stack)}`)
            results.message = 'Something went wrong, please try again!'
            res.status(SERVER_ERROR).send(results)
        }
    },

    patchPoint: async (req, res) => {
        let results = {}
        try {
            let userID = req.params.userID || null
            if(!db.isValidId(userID)) {
                results.message = 'Data not found'
                return res.status(NOT_FOUND).send(results);
            }
            let payload = await validate(req.body, PATCH)
            console.debug(`[CHECK][PAYLOAD] >>>>> ${JSON.stringify(payload)}`)
            if (payload.length > 0) {
                results.message = 'Validation error, please check your input data!'
                results.errors = payload
                return res.status(BAD_REQUEST).send(results);
            }


            let originData = await db.findOne(POINT_COLLECTION, { userID: userID })
            console.debug(`[GET][POINTS] >>>>> ${JSON.stringify(originData)}`)
            if (originData === null) {
                results.message = `No data found`
                return res.status(404).send(results);
            }

            // if (payload.type === "increase") {
            //     payload.point = originData.point + payload.point
            // }else {
            //     payload.point = originData.point + payload.point
            // }
            let point = (payload.type === "increase") ? originData.point + payload.point : originData.point - payload.point

            payload.updatedAt = new Date()

            let filter = { userID: userID }
            let data = { $set: {point: point } }
            let options = { upsert: false, returnDocument: 'after' };

            let update = await db.findAndUpdate(POINT_COLLECTION, filter, data, options)
            console.debug(`[PATCH][POINTS] >>>>> ${JSON.stringify(update)}`)
            if (update.value ===  null) {
                results.message = `Data not found`
                return res.status(BAD_REQUEST).send(results);
            }

            results.message= 'Successfully!'
            results.data = update.value
            res.send(results)
        } catch (e) {
            console.error(`[PATCH][POINTS] >>>>> ${JSON.stringify(e.stack)}`)
            results.message = 'Something went wrong, please try again!'
            res.status(SERVER_ERROR).send(results)
        }
    }

};
