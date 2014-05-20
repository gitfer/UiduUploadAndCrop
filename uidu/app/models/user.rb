require 'carrierwave/orm/activerecord'

class User < ActiveRecord::Base

  # Associations
  has_many :images

  mount_uploader :avatar, UiduAvatarUploader

  attr_accessor :crop_x, :crop_y, :crop_w, :crop_h
  attr_accessible :name, :avatar, :crop_x, :crop_y, :crop_w, :crop_h
  # validates :name, presence: true
  # validate :avatar_size_validation

  after_update :reprocess_avatar, :if => :cropping?

  def cropping?
    !crop_x.blank? && !crop_y.blank? && !crop_w.blank? && !crop_h.blank?
  end

  def avatar_geometry(style = nil)
    @geometry ||= {}
    # S3
    @geometry[style] ||= { :width => MiniMagick::Image.open('public/' + avatar.url(style))[:width], :height => MiniMagick::Image.open('public/' + avatar.url(style))[:height] }
  end

  include Rails.application.routes.url_helpers
  def to_jq_upload
    {
      "name" => avatar.filename,
      "size" => avatar.size,
      "url" => avatar.url,
      "url_original" => avatar.url(:original),
      "url_large" => avatar.url(:large),
      "original_width" =>  avatar_geometry()[:width],
      "original_height" =>  avatar_geometry()[:height],
      "large_width" =>  avatar_geometry(:large)[:width],
      "large_height" =>  avatar_geometry(:large)[:height],
      "id" =>  self.id,
      "delete_url" => user_path(self),
      "delete_type" => "DELETE"
    }
  end

  private

  def avatar_size_validation
    errors[:avatar] << "L'immagine deve avere una dimensione inferiore ai 5MB" if avatar.size > 5.megabytes
  end

  def reprocess_avatar
    avatar.recreate_versions!
  end

end
