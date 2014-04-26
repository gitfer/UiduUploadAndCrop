'use strict'

;
(function($, window, document, undefined) {

  var $form, $progressBar, $container;
  /* private vars */
  var idCropBox = 'cropbox';
  var idPreview = 'preview';

  // define your widget under a namespace of your choice
  //  with additional parameters e.g. 
  // $.widget( "namespace.widgetname", (optional) - an 
  // existing widget prototype to inherit from, an object 
  // literal to become the widget's prototype ); 

  $.widget('uidu.uiduUploader', {

    //Options to be used as defaults
    options: {
      selectionWidth: 40,
      selectionHeight: 40,
      previewWidth: 200,
      previewHeight: 200,
      croppingImageWidth: 100,
      croppingImageHeight: 100,
      containerId: 'cropContainer',
      allowedMimeTypes: ['image/png', 'image/gif', 'image/tiff', 'image/bmp', 'image/x-bmp',
        'image/jpeg', 'image/pjpeg'
      ],
      model: 'user',
      uploadUrl: '/users',
      imageMaxWidth: 800,
      enableCrop: true
    },


    _updateCrop: function(coords, width, height, largeWidth, largeHeight) {
      var rx = this.options.previewWidth / coords.w;
      var ry = this.options.previewHeight / coords.h;
      $('#' + idPreview).css({
        width: Math.round(rx * largeWidth) + 'px',
        height: Math.round(ry * largeHeight) + 'px',
        marginLeft: '-' + Math.round(rx * coords.x) + 'px',
        marginTop: '-' + Math.round(ry * coords.y) + 'px'
      });
      var ratio = width / height;
      $('#crop_x').val(Math.round(coords.x * ratio));
      $('#crop_y').val(Math.round(coords.y * ratio));
      $('#crop_w').val(Math.round(coords.w * ratio));
      $('#crop_h').val(Math.round(coords.h * ratio));
    },

    _showFileName: function(fileName) {
      $('.fileNameShowed').remove();
      $('<p class="fileNameShowed"/>').text(fileName)
        .insertBefore($container);
    },

    //Setup widget (eg. element creation, apply theming
    // , bind events etc.)
    _create: function() {
      var self = this;
      // _create will automatically run the first time 
      // this widget is called. Put the initial widget 
      // setup code here, then you can access the element 
      // on which the widget was called via this.element. 
      // The options defined above can be accessed 
      // via this.options this.element.addStuff();
      $form = self.element;
      $progressBar = jQuery('<div class="uidu-progress-bar"><span class="meter" style="width: 0%"></span></div>');
      $container = jQuery('#' + self.options.containerId);

      // HTML5 enhancement
      $form.find('input[type=file]').attr('accept', self.options.allowedMimeTypes.join(','));
      // Setting rails attrs
      $('#fileUploader').attr({
        'id': self.options.model + '_avatar',
        'name': self.options.model + '[avatar]'
      });
      $form.fileupload({
        url: self.options.uploadUrl,
        dataType: 'json',
        add: function(e, data) {
          $('#crop').addClass('hide'); 
          $('.fileNameShowed').remove();
          self._showFileName(data.files[0].name);

          $progressBar.insertBefore($container);

          if ($('#loadingImageButton').length > 0) {
            $('#loadingImageButton').remove();
          }

          data.context = $('<button id="loadingImageButton"/>').text('Carica immagine')
            .insertBefore($container)
            .click(function(e) {
              e.preventDefault();
              $('.loadingStatus').remove();
              data.context = $('<p class="loadingStatus"/>').text('Caricamento in corso. Attendere prego...').replaceAll($(this));
              data.submit();
            });

          $container.html('');
        },
        done: function(e, data) {
          data.context.text('Caricamento terminato.');
          $progressBar.remove();
          $('#crop').removeClass('hide');
          var $cropbox = jQuery('<div><img src="" alt="Immagine da ridimensionare" id="' + idCropBox + '" ></div>');
          var $preview = jQuery('<h4>Anteprima immagine</h4><div><img src="" alt="Immagine di anteprima" id="' + idPreview + '"></div>');

          $preview.filter('div:first').css({
            width: self.options.previewWidth + 'px',
            height: self.options.previewHeight + 'px',
            overflow: 'hidden'
          });
          $container.append($cropbox);
          $container.append($preview);

          jQuery.each(data.result.files, function(index, file) {
            jQuery('#userId').val(file.id);
            jQuery('#' + idPreview + ', #' + idCropBox + '').attr('src', file.url_large);
            $('#' + idCropBox).css({
              width: self.options.croppingImageWidth + 'px',
              height: self.options.croppingImageHeight + 'px'
            });
            var originalWidth = file.original_width;
            var originalHeight = file.original_height;
            var largeWidth = file.large_width;
            var largeHeight = file.large_height;

            jQuery('#' + idCropBox).Jcrop({
              bgColor: 'orange',
              onChange: function(coords) {
                self._updateCrop(coords, originalWidth, originalHeight, self.options.croppingImageWidth, self.options.croppingImageHeight);
              },
              onSelect: function(coords) {
                self._updateCrop(coords, originalWidth, originalHeight, self.options.croppingImageWidth, self.options.croppingImageHeight);
              },
              setSelect: [largeWidth / 2 - self.options.selectionWidth / 2, largeHeight / 2 - self.options.selectionHeight / 2, self.options.selectionWidth, self.options.selectionHeight],
              aspectRatio: 1,
              allowResize: false,
              minSize: [self.options.selectionWidth, self.options.selectionHeight],
              maxSize: [self.options.selectionWidth, self.options.selectionHeight]
            });

          });
        },
        progressall: function(e, data) {
          var progress = parseInt(data.loaded / data.total * 100, 10);
          $progressBar.find('span.meter').css({
            width: progress + '%',
            textAlign: 'center'
          }).text('Caricamento: ' + progress + '%');
        }
      });

      $('#crop').on('click', function() {
        self.crop('crop');
      });
    },

    // Destroy an instantiated plugin and clean up 
    // modifications the widget has made to the DOM
    destroy: function() {

      // this.element.removeStuff();
      // For UI 1.8, destroy must be invoked from the 
      // base widget
      $.Widget.prototype.destroy.call(this);
      // For UI 1.9, define _destroy instead and don't 
      // worry about 
      // calling the base widget
    },

    crop: function(event) {
      var formData = this.element.serialize();
      this._trigger('crop', event, {
        key: formData
      });
    },

    // Respond to any changes the user makes to the 
    // option method
    _setOption: function(key, value) {
      switch (key) {
        case 'someValue':
          //this.options.someValue = doSomethingWith( value );
          break;
        default:
          //this.options[ key ] = value;
          break;
      }

      // For UI 1.8, _setOption must be manually invoked 
      // from the base widget
      $.Widget.prototype._setOption.apply(this, arguments);
      // For UI 1.9 the _super method can be used instead
      // this._super( "_setOption", key, value );
    }
  });

})(jQuery, window, document);