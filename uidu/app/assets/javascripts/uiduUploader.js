/*jslint indent: 2 */

(function($, window, document, undefined) {
  'use strict';

  var $form, $progressBar, $container,
    idCropImage = 'cropImage',
    idPreview = 'preview';

  function UiduUploaderError(message) {
    this.name = 'UiduUploaderError';
    this.message = message;
    this.stack = (new Error()).stack;
  }

  UiduUploaderError.prototype = new Error();

  (function checkDependencies() {
    if (typeof ($.widget) !== 'function' || typeof ($.blueimp) !== 'object' || typeof ($.Jcrop) !== 'function') {
      throw new UiduUploaderError('Dipendenze per il plugin di upload non soddisfatte.');
    }
  })();

  $.widget('uidu.uiduUploader', {

    options: {
      selectionWidth: 40,
      selectionHeight: 40,
      previewWidth: 200,
      previewHeight: 200,
      enableCrop: false,
      croppingImageWidth: 100,
      aspectRatio: 1,
      containerId: 'cropContainer',
      label: 'Carica una immagine',
      allowedMimeTypes: ['png', 'gif', 'tiff', 'bmp', 'x-bmp', 'jpeg', 'pjpeg', 'jpg'],
      maxNumberOfFiles: 1,
      maxFileSize: 5000000,
      model: 'user',
      attribute: 'avatar',
      uploadUrl: '/users'
    },

    _updateCrop: function(coords, ratio) {
      var rx = this.options.previewWidth / coords.w,
        ry = this.options.previewHeight / coords.h;
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

    _createCropBox: function() {
      $container.append($('<div><img src="" alt="Immagine da ridimensionare" id="' + idCropImage + '" ></div>'));
    },

    _createPreview: function() {
      $container.append($('<h4>Anteprima immagine</h4><div><img src="" alt="Immagine di anteprima" id="' + idPreview + '"></div>'));
    },

    _upload: function() {
      var formData = this.element.serialize();
      $(this.element).trigger('upload', event, {
        key: formData
      });
    },
    _showErrorMessage: function(msg) {
      $('#uploaderError').removeClass('hide').text(msg);
    },
    _clearErrorMessage: function() {
      $('#uploaderError').text('').addClass('hide');
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
      $('.uiduUploaderContainer').loadTemplate('/templates/uiduUploader.html', {
        label: self.options.label
      }, {
        success: function() {
          $progressBar = $('<div class="uidu-progress-bar"><span class="meter" style="width: 0%"></span></div>');
          $container = $('#' + self.options.containerId);

          // HTML5 enhancement
          $form.find('input[type=file]').attr('accept', self.options.allowedMimeTypes.map(function(el) {
            return 'image/' + el;
          }).join(','));
          // Setting rails attrs
          $('#fileUploader').attr({
            'id': self.options.model + '_' + self.options.attribute + '',
            'name': self.options.model + '[' + self.options.attribute + ']'
          });
          $('.cropData').each(function() {
            $(this).attr({
              'name': self.options.model + '[' + $(this).attr('name') + ']'
            });
          });
          $.widget('blueimp.fileupload', $.blueimp.fileupload, {
            processActions: {
              maxFileSize: function(data, options) {
                if (options.disabled) {
                  return data;
                }
                var dfd = $.Deferred(),
                  file = data.files[data.index];
                if (file.size !== undefined) {
                  if (self.options.maxFileSize < file.size) {
                    file.error = 'L\'immagine deve avere una dimensione inferiore ai 5MB.';
                    dfd.rejectWith(this, [data]);
                  } else {
                    dfd.resolveWith(this, [data]);
                  }
                } else {
                  // Should we try testing for file size in different ways for IE < 9?
                  dfd.resolveWith(this, [data]);
                }
                return dfd.promise();
              },
              validate: function(data, options) {
                if (options.disabled) {
                  return data;
                }
                var dfd = $.Deferred(),
                  file = data.files[data.index];
                if (file.type !== undefined) {
                  // FILE API is supported, we can check file attributes using blueimp methods
                  if (!options.acceptFileTypes.test(file.type)) {
                    file.error = 'Formato non supportato. (' + self.options.allowedMimeTypes.join(',') + ')';
                    dfd.rejectWith(this, [data]);
                  } else {
                    dfd.resolveWith(this, [data]);
                  }
                } else {
                  // IE < 9, we should check fily type by name
                  if (!options.acceptFileTypes.test(file.name)) {
                    file.error = 'Formato non supportato. (' + self.options.allowedMimeTypes.join(',') + ')';
                    dfd.rejectWith(this, [data]);
                  } else {
                    dfd.resolveWith(this, [data]);
                  }
                }
                return dfd.promise();
              }
            }
          });
          $form.fileupload({
            url: self.options.uploadUrl,
            dataType: 'json',
            acceptFileTypes: new RegExp('(.|/)(' + self.options.allowedMimeTypes.join('|') + ')$', 'i'),
            type: 'POST',
            processQueue: [{
              action: 'validate',
              acceptFileTypes: '@',
              disabled: '@disableValidation'
            }, {
              action: 'maxFileSize'
            }],
            add: function(e, data) {

              self._showFileName(false, data.files[0].name);

              if ($('#loadingImageButton').length > 0) {
                $('#loadingImageButton').remove();
              }

              // TODO Make validation optional only for browser that support it
              var $this = $(this),
                validation = data.process(function() {
                self._clearErrorMessage();
                return $this.fileupload('process', data);
              });

              validation.done(function() {
                $progressBar.find('span.meter').css({
                  width: 0 + '%',
                  textAlign: 'center'
                }).text('');
                $progressBar.insertBefore($container);
                data.context = $('<button id="loadingImageButton" class="uidu-bottone"><i class="fi-upload"></i><span>Carica</span></button>');
                $('.loadingStatus').remove();
                data.context = $('<p class="loadingStatus"/>').text('Caricamento in corso. Attendere prego...').replaceAll($('#loadingImageButton'));
                data.submit()
                  .success(function(result, textStatus, jqXHR) {
                    self._clearErrorMessage();
                  })
                  .error(function(jqXHR, textStatus, errorThrown) {
                    data.context.text('');
                    self._showErrorMessage(JSON.parse(jqXHR.responseText).avatar.join(' '));
                  });
                  // .insertBefore($container)
                  // .click(function(e) {
                  //   e.preventDefault();
                  //   $('.loadingStatus').remove();
                  //   data.context = $('<p class="loadingStatus"/>').text('Caricamento in corso. Attendere prego...').replaceAll($(this));
                  //   data.submit()
                  //     .success(function(result, textStatus, jqXHR) {
                  //       self._clearErrorMessage();
                  //     })
                  //     .error(function(jqXHR, textStatus, errorThrown) {
                  //       data.context.text('');
                  //       self._showErrorMessage(JSON.parse(jqXHR.responseText).avatar.join(' '));
                  //     });
                  // });
              });
              validation.fail(function(data) {
                self._showErrorMessage(data.files[0].error);
              });

              $container.html('');
            },
            done: function(e, data) {
              data.context.text('Caricamento terminato.');
              $progressBar.remove();

              self._createCropBox();
              self._createPreview();
              $.each(data.result.files, function(index, file) {
                // preview e crop usano la immagine large
                $('#' + idPreview + ', #' + idCropImage).attr('src', file.url_large);

                var ratio = file.original_width / file.original_height,
                    largeWidth = file.large_width,
                    largeHeight = file.large_height,
                    ratioForCropping = file.original_width / self.options.croppingImageWidth;

                $('#' + idCropImage).css({
                  width: self.options.croppingImageWidth + 'px',
                  height: self.options.croppingImageWidth / ratio + 'px'
                });

                if (self.options.enableCrop === true) {
                  $('#' + idPreview).parent('div').css({
                    width: self.options.previewWidth + 'px',
                    height: self.options.previewHeight + 'px',
                    overflow: 'hidden'
                  });

                  $(self.element).trigger('fileid', {
                    fileid: file.id
                  });

                  $('#' + idCropImage).load(function() {
                    $.Jcrop('#' + idCropImage, {
                      bgColor: '#FFFFFF',
                      onChange: function(coords) {
                        self._updateCrop(coords, ratioForCropping);
                      },
                      onSelect: function(coords) {
                        self._updateCrop(coords, ratioForCropping);
                      },
                      onRelease: function(coords) {
                        self._updateCrop(coords, ratioForCropping);
                      },
                      setSelect: [largeWidth / 2 - self.options.selectionWidth / 2, largeHeight / 2 - self.options.selectionHeight / 2, self.options.selectionWidth, self.options.selectionHeight],
                      aspectRatio: self.options.aspectRatio,
                      allowResize: true
                    });
                  });
                } else {
                  $('#' + idPreview).css({
                    width: self.options.previewWidth + 'px'
                  });
                  $('#' + idCropImage).hide();
                  self._upload('upload');
                }
              });
            }
          })
          .on('fileuploadprocessalways', function(e, data) {
            // console.log('processalways');
          }).on('fileuploadprogressall', function(e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $progressBar.find('span.meter').css({
              width: progress + '%',
              textAlign: 'center'
            }).text('Caricamento: ' + progress + '%');
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