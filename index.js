'use strict'

const math = require('mathjs')
const fs = require('fs')
const co = require('co')
const Table = require('cli-table')

const options =
	{ readCount: 250
	, fileName: 'package.json'
	}

const libs =
	[
		{ name: 'node'
		, Promise: Promise
		,	results: []
		}, { name: 'bluebird'
		, Promise: require('bluebird').Promise
		,	results: []
		}, { name: 'promise'
		, Promise: require('promise')
		,	results: []
		}, { name: 'q'
		, Promise: require('q').Promise
		,	results: []
		}
	]

	//Lets require/import the HTTP module
var http = require('http');

//Lets define a port we want to listen to
const PORT=8080;
//We need a function which handles requests and send response
function handleRequest(request, response){
	// console.log('response')
	response.end('It Works!! Path Hit: ' + request.url);
}

//Create a server
var server = http.createServer(handleRequest);

var counter = 0

function simpleTest(promise) {
	let stamp = Date.now()
	let promises = []
	for (let i=0; i < options.readCount; i++) {
		promises.push(new promise((resolve, reject) => {
			setTimeout(() => {
				http.get('http://localhost:' + PORT, (res) => {
					// console.log("Got response: " + res.statusCode + counter++);
					resolve(res)
				}).on('error', function(e) {
				  console.log("Got error: " + e.message)
					reject(e)
				})
			}, 20)
		}))
	}

	return promise.all(promises).then(() => {
			return Date.now() - stamp
		})
}

function* runner(libs) {
	return co(function* (){
		for (let i in libs) {
			console.log('Running ' + libs[i].name)
			libs[i].results.push(yield simpleTest(libs[i].Promise))
		}
	})
}

function cleanResults() {
	for (let i in libs) {
		libs[i].results = [];
	}
}
server.listen(PORT, function (){
	//Callback triggered when server is successfully listening. Hurray!
	console.log("Server listening on: http://localhost:%s", PORT);
	co(function* (){
		yield runner(libs)
		cleanResults()
		yield runner(libs.reverse())
		yield runner(libs.reverse())
		yield runner(libs.reverse())
		yield runner(libs.reverse())
		yield runner(libs.reverse())
		yield runner(libs.reverse())
	}).then(() => {
		console.log(prepareTable().toString())
		server.close()
	})

});

function prepareTable() {
	let table = new Table({ head: ['name', 'mean', 'max', 'min', 'std', 'var'] })
	libs.forEach((lib) => {
		// console.log(lib.results)
		table.push([ lib.name
			, math.mean(lib.results).toFixed(2)
			, math.max(lib.results)
			, math.min(lib.results)
			, math.std(lib.results).toFixed(2)
			, math.var(lib.results).toFixed(2)
		])
	})
	return table
}
