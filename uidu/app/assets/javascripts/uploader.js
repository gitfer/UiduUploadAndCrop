      var config = {
          selectionWidth: 40,
          selectionHeight: 40,
          previewWidth: 200,
          previewHeight: 200,
          croppingImageWidth: 100,
          croppingImageHeight: 100,
          containerId: "cropContainer",
          allowedMimeTypes: ["image/png", "image/gif", "image/tiff", "image/bmp", "image/x-bmp", 
                            "image/jpeg", "image/pjpeg"],
          model: 'user',
          uploadUrl: '/users',
          imageMaxWidth: 800,
          enableCrop: true
      };
      /* private vars */
      var idCropBox = "cropbox";
      var idPreview = "preview";

function update_crop(coords, width, height, large_width, large_height) {
    var rx = config.previewWidth/coords.w;
    var ry = config.previewHeight/coords.h;
    $('#'+idPreview).css({
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
       var $form = $('#fileupload'); 
       var $progressBar = jQuery('<div class="uidu-progress-bar"><span class="meter" style="width: 0%"></span></div>');
       var $container = jQuery("#"+config.containerId);

       // HTML5 enhancement
       $form.find("input[type=file]").attr("accept", config.allowedMimeTypes.join(','));
       // Setting rails attrs
       $('#fileUploader').attr({
        "id": config.model+"_avatar",
        "name": config.model + "[avatar]"
        });

       function showFileName (fileName) {
          $('.fileNameShowed').remove();
          $('<p class="fileNameShowed"/>').text(fileName)
          .insertBefore($container);
       }

       $form.fileupload({
              url: config.uploadUrl,
              dataType: 'json',
              add: function  (e, data) {
                $('#crop').addClass('hide');
                showFileName(data.files[0].name);
                data.context = $('<button/>').text('Carica immagine')
                .insertBefore($container)
                .click(function () {
                    $(".loadingStatus").remove();
                    data.context = $('<p class="loadingStatus"/>').text('Caricamento in corso. Attendere prego...').replaceAll($(this));
                    data.submit();
                });

                $container.html('');
                $container.append($progressBar);
              },
              done: function (e, data) { 
                data.context.text('Caricamento terminato.');
                $container.find($progressBar).remove();
                $('#crop').removeClass('hide');
                var $cropbox = jQuery('<div><img src="" alt="Immagine da ridimensionare" id="' + idCropBox + '" ></div>');
                var $preview = jQuery('<h4>Anteprima immagine</h4><div><img src="" alt="Immagine di anteprima" id="' + idPreview + '"></div>');
              
                $preview.filter('div:first').css({
                  width: config.previewWidth + 'px',
                  height: config.previewHeight + 'px',
                  overflow: 'hidden'
                });
                $container.append($cropbox)
                $container.append($preview);

                  jQuery.each(data.result.files, function (index, file) {
                      jQuery('#userId').val(file.id); 
                      jQuery('#' + idPreview +', #' + idCropBox + '').attr("src", file.url_large);
                      $('#' + idCropBox).css({
                        width: config.croppingImageWidth + 'px',
                        height: config.croppingImageHeight + 'px'
                      });
                      var original_width = file.original_width;
                      var original_height = file.original_height;
                      var large_width = file.large_width;
                      var large_height = file.large_height;

                      jQuery('#'+idCropBox).Jcrop({
                        bgColor: 'orange',
                        onChange: function(coords) {
                            update_crop(coords, original_width, original_height, config.croppingImageWidth, config.croppingImageHeight);
                          },
                        onSelect: function(coords) {
                            update_crop(coords, original_width, original_height, config.croppingImageWidth, config.croppingImageHeight);
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
      	     	    $progressBar.find("span.meter").css("width", progress+"%");
              }
          });

      $("#crop").on('click', function () { 
        var valuesToSubmit =  $(this).closest('form').serialize();
        console.log(valuesToSubmit);
        $.ajax({
            url: "/updateAvatar", //sumbits it to the given url of the form
            data: valuesToSubmit,
            method: "PUT",
            dataType: "JSON" // you want a difference between normal and ajax-calls, and json is standard
        }).success(function(json){
            //act on result.
        }).error(function () {
          console.log("Crop fallito");
        });
      });

  });
