      var config = {
          imageMaxWidth: 800,
          selectionWidth: 40,
          selectionHeight: 40,
          previewWidth: 300,
          previewHeight: 300,
          containerId: "cropContainer"
      };

function update_crop(coords, width, height, large_width, large_height) {
    var rx = config.previewWidth/coords.w;
    var ry = config.previewHeight/coords.h;
    $('#preview').css({
        width: Math.round(rx * large_width) + 'px',
        height: Math.round(ry * large_height) + 'px',
        marginLeft: '-' + Math.round(rx * coords.x) + 'px',
        marginTop: '-' + Math.round(ry * coords.y) + 'px'
    });
  var ratio = width / height; 
  $("#crop_x").val(Math.round(coords.x * ratio));
  $("#crop_y").val(Math.round(coords.y * ratio));
  $("#crop_w").val(Math.round(coords.w * ratio));
  $("#crop_h").val(Math.round(coords.h * ratio));
}

  $(function () {
      /* private vars */
      var idCropBox = "cropbox";
      var idPreview = "preview";
       // var $progressBar = jQuery('<div class="uidu-progress-bar"><span class="meter" style="width: 0%"></span></div>');
       var $container = jQuery("#"+config.containerId);

       $('#fileupload').fileupload({
              url: '/users',
              dataType: 'json',
              done: function (e, data) {
                var $cropbox = jQuery('<div><img src="" alt="Immagine da ridimensionare" id="' + idCropBox + '"></div>');
                var $preview = jQuery('<h4>Anteprima immagine</h4><div><img src="" alt="Immagine di anteprima" id="' + idPreview + '"></div>');
                $preview.filter('div:first').css({
                  width: config.previewWidth + 'px',
                  height: config.previewHeight + 'px',
                  overflow: 'hidden'
                });
                jQuery("#"+config.containerId).html('');
                jQuery("#"+config.containerId).append($cropbox)
                jQuery("#"+config.containerId).append($preview);

                  jQuery.each(data.result.files, function (index, file) {
                      jQuery('#' + idPreview +', #' + idCropBox + '').attr("src", file.url_large);
                      jQuery('<p/>').text(file.url).appendTo('#files');
                      var original_width = file.original_width;
                      var original_height = file.original_height;
                      var large_width = file.large_width;
                      var large_height = file.large_height;

                      jQuery('#'+idCropBox).Jcrop({
                        bgColor: 'orange',
                        onChange: function(coords) {
                            update_crop(coords, original_width, original_height, large_width, large_height);
                          },
                        onSelect: function(coords) {
                            update_crop(coords, original_width, original_height, large_width, large_height);
                          },
                        setSelect: [large_width/2-config.selectionWidth/2, large_width/2-config.selectionWidth/2, config.selectionWidth, config.selectionHeight],
                        aspectRatio: 1,
                        allowResize: false,
                        minSize: [ config.selectionWidth, config.selectionHeight ],
                        maxSize: [ config.selectionWidth, config.selectionHeight ]
                      });

                  });
              },
              progressall: function (e, data) {
                  var progress = parseInt(data.loaded / data.total * 100, 10);
      	     	    console.log(progress + '%');
              }
          }).prop('disabled', !$.support.fileInput)
              .parent().addClass($.support.fileInput ? undefined : 'disabled');

  });
