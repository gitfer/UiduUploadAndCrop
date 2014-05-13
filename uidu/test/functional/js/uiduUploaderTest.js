casper.options.verbose = true;
casper.options.logLevel = 'info';

var FUNCTIONAL_TEST_PATH = 'test/functional/js';
var BASE_URL = casper.cli.get('url');
var testImage = 'uidu-mongolfiera.png';
var testImageWithPath = FUNCTIONAL_TEST_PATH + '/images/' + testImage;

function debug() {
	casper.capture('debug.png');
}

function uploadImage() {
	var inputFileName = casper.getElementAttribute('input[type=file]', 'name').toString();
	var formData = {};
	formData[inputFileName] = FUNCTIONAL_TEST_PATH + '/images/uidu-mongolfiera.png';
	return formData;
}

casper.test.begin('Uploader deve essere presente nella pagina', function suite(test) {

	casper.start(BASE_URL, function() {
		this.test.assertEquals(this.getCurrentUrl(), BASE_URL, 'url === ' + BASE_URL);
	});

	casper.then(function() {
		test.assertTextExists('Carica una immagine', 'Legenda "Carica una immagine" visibile');
	});

	casper.run(function() {
		test.done();
	});
});

casper.test.begin('Upload deve mostrare bottone di upload server side', function suite(test) {
	casper.then(function() {
		this.fill('form', uploadImage(), false);
		// debug();
		test.assertExists('input#loadingImageButton[value="Carica immagine"]', 'Il testo del bottone di upload è "Carica immagine"');
		test.assertEquals(this.visible('#loadingImageButton'), true, 'Id del bottone di upload presente');
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
		test.assertVisible('#loadingImageButton', 'Id del bottone di upload presente');

		this.click('#loadingImageButton');
		casper.waitForResource(testImage, function() {
			test.assertVisible('#cropButton', 'Id del bottone di crop presente');
			test.assertSelectorHasText('#cropButton > span', 'Ritaglia', 'Il testo del bottone di crop è "Ritaglia"');

		});
	});
	casper.run(function() {
		test.done();
	});
});

casper.test.begin('Upload senza crop', function suite(test) {
	casper.start(BASE_URL, function() {
	});

	casper.then(function() {
		casper.evaluate(function() {
			$('form').uiduUploader({
				enableCrop: false
			});
		});

		this.fill('form', uploadImage(), false);
		test.assertEquals(this.exists('#loadingImageButton'), true, 'Id del bottone di upload presente');

		this.click('#loadingImageButton');
		casper.waitForResource(testImage, function() {
			debug();
			test.assertEquals(this.exists('#cropButton'), true, 'Id del bottone di crop è presente');
			test.assertEquals(this.visible('#cropButton'), false, 'Id del bottone di crop è presente ma non visibile');
		});
	});
	casper.run(function() {
		test.done();
	});
});