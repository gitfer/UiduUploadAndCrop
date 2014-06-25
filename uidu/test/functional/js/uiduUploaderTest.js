casper.options.verbose = true;
casper.options.logLevel = 'info';

var FUNCTIONAL_TEST_PATH = 'test/functional/js';
var BASE_URL = casper.cli.get('url');
var testImage = 'uidu-mongolfiera.png';
var svgImage = 'svgImage.svg';
var pandaImage = 'panda.JPG';
var testImagePath = FUNCTIONAL_TEST_PATH + '/images/';

function debug() {
	casper.capture('debug.png');
}

function uploadImage(fileName) {
	var fileName = fileName || testImage;
	var inputFileName = casper.getElementAttribute('input[type=file]', 'name').toString();
	var formData = {};
	formData[inputFileName] = testImagePath + fileName;
	return formData;
}

casper.test.begin('Uploader deve essere presente nella pagina', function suite(test) {

	casper.start(BASE_URL, function() {
		this.test.assertEquals(this.getCurrentUrl(), BASE_URL, 'url === ' + BASE_URL);
	});

	casper.then(function() {
		test.assertTextExists('', 'Legenda con testo "" visibile');
	});

	casper.run(function() {
		test.done();
	});
});

casper.test.begin('Upload deve mostrare bottone di upload server side', function suite(test) {
	casper.then(function() {
		this.fill('form', uploadImage(), false);
		debug();
		test.assertSelectorHasText('div.uidu-bottone > span', 'Seleziona', 'Il testo del bottone di upload è "Seleziona"');
	});

	casper.run(function() {
		test.done();
	});
});

casper.test.begin('Crop', function suite(test) {
	casper.then(function() {
		casper.evaluate(function() {
			$('form').uiduUploader({
				enableCrop: true
			});
		});

		this.fill('form', uploadImage(), false);
		test.assertVisible('div.uidu-bottone > span', 'Bottone di upload presente');

		this.click('div.uidu-bottone > span');
		casper.waitForResource(testImage, function() {
			debug();
			test.assertVisible('.cropper-container > img', 'Immagine con area di crop presente');
		});
	});
	casper.run(function() {
		test.done();
	});
});

casper.test.begin('Upload senza crop', function suite(test) {
	casper.start(BASE_URL, function() {});

	casper.then(function() {
		casper.evaluate(function() {
			$('form').uiduUploader({
				enableCrop: false
			});
		});

		this.fill('form', uploadImage(), false);
		test.assertNotVisible('#cropImage', 'La immagine per la selezione della area da croppare non è visibile');

		this.click('div.uidu-bottone > span');
		casper.waitForResource(testImage, function() {
			test.assertNotVisible('.jcrop-tracker', 'Immagine con area di crop non presente');
		});

	});
	casper.run(function() {
		test.done();
	});
});

casper.test.begin('Tipo non supportato clientside', function suite(test) {
	casper.then(function() {
		this.fill('form', uploadImage(svgImage), false);
		test.assertTextExists('Formato non supportato.', 'A caricamento terminato appare il messaggio di errore \"Formato non supportato.\" coi tipi supportati');
	});
	casper.run(function() {
		test.done();
	});
});


casper.test.begin('Dimensione immagina troppo grande clientside', function suite(test) {
	casper.then(function() {
		this.fill('form', uploadImage(pandaImage), false);
		test.assertTextExists('L\'immagine deve avere una dimensione inferiore ai 5MB.', 'A caricamento terminato appare il messaggio di errore \"L\'immagine deve avere una dimensione inferiore ai 5MB.\" ');
	});
	casper.run(function() {
		test.done();
	});
});