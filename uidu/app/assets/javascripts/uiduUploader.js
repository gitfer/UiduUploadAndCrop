'use strict'

;
(function($, window, document, undefined) {

  var $form, $progressBar, $container;

  var idCrop = 'cropbox';
  var idPreview = 'preview';

  $.widget('uidu.uiduUploader', {

    options: {
      selectionWidth: 40,
      selectionHeight: 40,
      previewWidth: 200,
      previewHeight: 200,
      enableCrop: false,
      croppingImageWidth: 100,
      containerId: 'cropContainer',
      allowedMimeTypes: ['image/png', 'image/gif', 'image/tiff', 'image/bmp', 'image/x-bmp',
        'image/jpeg', 'image/pjpeg'
      ],
      model: 'user',
      uploadUrl: '/users'
    },

    _updateCrop: function(coords, ratio, originalWidth) {
      var rx = this.options.previewWidth / coords.w;
      var ry = this.options.previewHeight / coords.h;
      $('#' + idPreview).css({
        width: Math.round(rx * this.options.croppingImageWidth) + 'px',
        marginLeft: '-' + Math.round(rx * coords.x) + 'px',
        marginTop: '-' + Math.round(ry * coords.y) + 'px'
      });
      $('#crop_x').val(Math.round(coords.x * ratio));
      $('#crop_y').val(Math.round(coords.y * ratio));
      $('#crop_w').val(Math.round(coords.w * ratio));
      $('#crop_h').val(Math.round(coords.h * ratio));
     },

    _showFileName: function(showFileName, fileName) {
      $('.fileNameShowed').remove();
      if (showFileName === true) {
        $('<p class="fileNameShowed"/>').text(fileName)
          .insertBefore($container);
      }
    },

    _showCropBox: function(showCropBox) {
      if (showCropBox === true) {
        $('#' + idCrop).removeClass('hide');
        $('#cropButton').removeClass('hide');
      } else {
        $('#' + idCrop).addClass('hide');
        $('#cropButton').addClass('hide');
      }
    },

    _createCropBox: function() {
      var $cropbox = jQuery('<div><img src="" alt="Immagine da ridimensionare" id="' + idCrop + '" ></div>');
      $container.append($cropbox);
    },

    _createPreview: function() {
      var $preview = jQuery('<h4>Anteprima immagine</h4><div><img src="" alt="Immagine di anteprima" id="' + idPreview + '"></div>');
      $container.append($preview);
    },

    _crop: function(event) {
      var formData = this.element.serialize();
      this._trigger('crop', event, {
        key: formData
      });
    },

    _upload: function() {
      var formData = this.element.serialize();
      this._trigger('upload', 'upload', {
        key: formData
      });
    },

    _setOption: function(key, value) {
      switch (key) {
        case 'someValue':
          //this.options.someValue = doSomethingWith( value );
          break;
        default:
          this.options[key] = value;
          break;
      }

      // For UI 1.8, _setOption must be manually invoked 
      // from the base widget
      $.Widget.prototype._setOption.apply(this, arguments);
      // For UI 1.9 the _super method can be used instead
      // this._super( "_setOption", key, value );
    },

    _create: function() {
      var self = this;
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
      $('.cropData').each(function() {
        $(this).attr({
          'name': self.options.model + '[' + $(this).attr('name') + ']'
        });
      });
      $form.fileupload({
        url: self.options.uploadUrl,
        dataType: 'json',
        add: function(e, data) {
          $('#cropButton').addClass('hide');

          self._showFileName(false, data.files[0].name);

          $progressBar.find('span.meter').css({
            width: 0 + '%',
            textAlign: 'center'
          }).text('');
          $progressBar.insertBefore($container);

          if ($('#loadingImageButton').length > 0) {
            $('#loadingImageButton').remove();
          }

          data.context = $('<input type="button" class="button" id="loadingImageButton"/>').attr('value', 'Carica immagine')
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

          self._createCropBox();
          self._createPreview();
          jQuery.each(data.result.files, function(index, file) {
            // preview e crop usano la immagine large
            jQuery('#' + idPreview + ', #' + idCrop).attr('src', file.url_large);

            var originalWidth = file.original_width;
            var originalHeight = file.original_height;
            var ratio = originalWidth / originalHeight;
            var largeWidth = file.large_width;
            var largeHeight = file.large_height;
            var ratioForCropping = file.original_width / self.options.croppingImageWidth;

            $('#' + idCrop).css({
              width: self.options.croppingImageWidth + 'px',
              height: self.options.croppingImageWidth / ratio + 'px'
            });

            self._showCropBox(self.options.enableCrop);

            if (self.options.enableCrop === true) {
              $('#' + idPreview).parent('div').css({
                width: self.options.previewWidth + 'px',
                height: self.options.previewWidth + 'px',
                overflow: 'hidden'
              });

              self._trigger('fileid', 'fileid', {
                fileid: file.id
              });

              jQuery('#' + idCrop).Jcrop({
                bgColor: 'orange',
                onChange: function(coords) {
                  self._updateCrop(coords, ratioForCropping);
                },
                onSelect: function(coords) {
                  self._updateCrop(coords, ratioForCropping);
                },
                setSelect: [largeWidth / 2 - self.options.selectionWidth / 2, largeHeight / 2 - self.options.selectionHeight / 2, self.options.selectionWidth, self.options.selectionHeight],
                aspectRatio: 1,
                allowResize: false,
                minSize: [self.options.selectionWidth, self.options.selectionHeight],
                maxSize: [self.options.selectionWidth, self.options.selectionHeight]
              });
            } else {
              $('#' + idPreview).css({
                width: self.options.previewWidth + 'px'
              });
              self._upload();
            }
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

      $('#cropButton').on('click', function() {
        self._crop('crop');
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
    }
  });

})(jQuery, window, document);