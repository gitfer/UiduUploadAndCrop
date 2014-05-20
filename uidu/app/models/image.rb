class Image < ActiveRecord::Base

  mount_uploader :image, ImageUploader
  # Associations
  belongs_to :user
  # belongs_to :gallery

  attr_accessible :description, :gallery_id, :image, :title, :user_id, :crop_x, :crop_y, :crop_w, :crop_h

  attr_accessor :crop_x, :crop_y, :crop_w, :crop_h
  # validates :name, presence: true
  # validate :avatar_size_validation

  after_update :reprocess_avatar, :if => :cropping?

  def cropping?
    !crop_x.blank? && !crop_y.blank? && !crop_w.blank? && !crop_h.blank?
  end

  def image_geometry(style = nil)
    @geometry ||= {}
    # S3
    @geometry[style] ||= { :width => MiniMagick::Image.open('public/' + image.url(style))[:width], :height => MiniMagick::Image.open('public/' + image.url(style))[:height] }
  end

  include Rails.application.routes.url_helpers
  def to_jq_upload
    {
      "name" => image.filename,
      "size" => image.size,
      "url" => image.url,
      "url_original" => image.url(:original),
      "url_large" => image.url(:large),
      "original_width" =>  image_geometry()[:width],
      "original_height" =>  image_geometry()[:height],
      "large_width" =>  image_geometry(:large)[:width],
      "large_height" =>  image_geometry(:large)[:height],
      "id" =>  self.id,
      "delete_url" => user_path(self),
      "delete_type" => "DELETE"
    }
  end

  private

  def avatar_size_validation
    errors[:image] << "L'immagine deve avere una dimensione inferiore ai 5MB" if image.size > 5.megabytes
  end

  def reprocess_avatar
    image.recreate_versions!
  end
end
