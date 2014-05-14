'use strict'

;
(function($, window, document, undefined) {

  var $form, $progressBar, $container;

  var idCropImage = 'cropImage';
  var idCropbox = 'cropBox';
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
      legenda: 'Carica una immagine',
      testoBottoneCrop: 'Ritaglia',
      allowedMimeTypes: ['image/png', 'image/gif', 'image/tiff', 'image/bmp', 'image/x-bmp',
        'image/jpeg', 'image/pjpeg'
      ],
      model: 'user',
      uploadUrl: '/users'
    },

    _updateCrop: function(coords, ratio) {
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

    _showCropBox: function() {
      $('#' + idCropbox).removeClass('hide');
    },

    _hideCropBox: function() {
      $('#' + idCropbox).addClass('hide');
    },
    _createCropBox: function() {
      $container.append($('<div><img src="" alt="Immagine da ridimensionare" id="' + idCropImage + '" ></div>'));
    },

    _createPreview: function() {
      $container.append($('<h4>Anteprima immagine</h4><div><img src="" alt="Immagine di anteprima" id="' + idPreview + '"></div>'));
    },

    _crop: function(event) {
      var formData = this.element.serialize();
      $('#cropButton').trigger('crop', event, {
        key: formData
      });
    },

    _upload: function() {
      var formData = this.element.serialize();
      $('#cropButton').trigger('upload', 'upload', {
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
      jQuery('.uiduUploaderContainer').loadTemplate('/templates/uiduUploader.html', {
        legenda: self.options.legenda,
        cropButtonText: self.options.testoBottoneCrop
      }, {
        success: function() {
          $progressBar = $('<div class="uidu-progress-bar"><span class="meter" style="width: 0%"></span></div>');
          $container = $('#' + self.options.containerId);


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
            acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
            processQueue: [{
              action: 'validate',
              acceptFileTypes: '@',
              disabled: '@disableValidation'
            }],
            add: function(e, data) {

              self._showFileName(false, data.files[0].name);

              $progressBar.find('span.meter').css({
                width: 0 + '%',
                textAlign: 'center'
              }).text('');
              $progressBar.insertBefore($container);

              if ($('#loadingImageButton').length > 0) {
                $('#loadingImageButton').remove();
              }

              var $this = $(this);
              var validation = data.process(function() {
                return $this.fileupload('process', data);
              });

              validation.done(function() {

                data.context = $('<input type="button" class="uidu-bottone" id="loadingImageButton" value="Carica immagine"/>')
                  .insertBefore($container)
                  .click(function(e) {
                    e.preventDefault();
                    $('.loadingStatus').remove();
                    data.context = $('<p class="loadingStatus"/>').text('Caricamento in corso. Attendere prego...').replaceAll($(this));
                    data.submit();
                  });
              });
              validation.fail(function(data) {
                console.log('Upload error: ' + data.files[0].error);
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
                jQuery('#' + idPreview + ', #' + idCropImage).attr('src', file.url_large);

                var originalWidth = file.original_width;
                var originalHeight = file.original_height;
                var ratio = originalWidth / originalHeight;
                var largeWidth = file.large_width;
                var largeHeight = file.large_height;
                var ratioForCropping = file.original_width / self.options.croppingImageWidth;

                $('#' + idCropImage).css({
                  width: self.options.croppingImageWidth + 'px',
                  height: self.options.croppingImageWidth / ratio + 'px'
                });

                if (self.options.enableCrop === true) {
                  self._showCropBox();
                  $('#' + idPreview).parent('div').css({
                    width: self.options.previewWidth + 'px',
                    height: self.options.previewWidth + 'px',
                    overflow: 'hidden'
                  });

                  $('#cropBox').trigger('fileid', 'fileid', {
                    fileid: file.id
                  });

                  jQuery('#' + idCropImage).Jcrop({
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
                  self._hideCropBox();
                  $('#' + idPreview).css({
                    width: self.options.previewWidth + 'px'
                  });
                  self._upload();
                }
              });
            }
          }).bind('fileuploadprocessalways', function(e, data) {
            console.log('processalways');
          }).bind('fileuploadprogressall', function(e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $progressBar.find('span.meter').css({
              width: progress + '%',
              textAlign: 'center'
            }).text('Caricamento: ' + progress + '%');
          });

          $('#cropButton').on('click', function() {
            self._crop('crop');
          });
        }
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