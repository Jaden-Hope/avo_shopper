const express = require('express');
const { engine } = require('express-handlebars');
const avoFactory = require('./avo-shopper');
const { Pool } = require('pg');

const app = express();

const connectionString = 'postgres://xvrlmxrgdqkbqc:764b52b7b3ca1e5ef958fca109b240566a57d87f76a663c071dcc5b1764c4fe7@ec2-63-32-12-208.eu-west-1.compute.amazonaws.com:5432/d6qbra6gk27qop';

const pool = new Pool({
	connectionString,
	ssl: {
		rejectUnauthorized: false,
	}
})

pool.connect();

const factory = avoFactory(pool);

// enable the req.body object - to allow us to use HTML forms
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// enable the static folder...
app.use(express.static('public'));

// add more middleware to allow for templating support
app.engine('handlebars', engine({ defaultLayout: 'main', layoutsDir: `${__dirname}/views/layouts` }));
app.set('view engine', 'handlebars');

app.get('/', async (req, res) => {
	res.render('index', { topDeals: await factory.topFiveDeals() });
});

app.get('/show/:name/:shop', async (req, res) => {
	req.params.shop++;
	const deals = await factory.dealsForShop(req.params.shop);
	res.render('index', { deals, name: req.params.name });
})

app.post('/shops', async (req, res) => {
	let input = req.body.addShopIn;
	let result = input[0].toUpperCase() + input.slice(1).toLowerCase();
	console.log(result);
	await factory.createShop(result)
	res.redirect('/shops');
})

app.get('/shops', async (req, res) => {
	const shopList = await factory.listShops();
	res.render('shopsList', { shopList });
})

app.get('/addShop', async (req, res) => {
	res.render('addShops');
})

app.get('/newDeal', async (req, res) => {
	const shops = await factory.listShops();
	res.render('addDeals', { shops });
})

app.post('/newDeal', async (req, res) => {
	await factory.createDeal(req.body.shops, req.body.newDealQty, req.body.newDealPrice);
	res.redirect('/');
})

app.get('/searchShops', async (req, res) => {
	res.render('searchShops')
})

app.post('/searchShops', async (req, res) => {
	const searchResults = await factory.recommendDeals(req.body.budget);
	res.render('searchShops', { searchResults })
})

// start  the server and start listening for HTTP request on the PORT number specified...
const PORT = process.env.PORT || 3019;

app.listen(PORT, function () {
	console.log(`AvoApp started on port ${PORT}`)
});