class User < ActiveRecord::Base
  attr_accessible :name, :avatar, :crop_x, :crop_y, :crop_w, :crop_h
  has_attached_file :avatar, :styles  => { :small => "100x100#", :large => "500x500>" }
  validates_attachment_presence :avatar
  validates_attachment_size :avatar, :less_than => 5.megabytes
  validates_attachment_content_type :avatar, :content_type => ['image/jpeg', 'image/pjpeg', 'image/png']
  after_update :reprocess_avatar, :if => :cropping?

  def cropping?
    !crop_x.blank? && !crop_y.blank? && !crop_w.blank? && !crop_h.blank?
  end

  def avatar_geometry(style = :original)
    @geometry ||= {}
    @geometry[style] ||= Paperclip::Geometry.from_file(avatar.path(style))
  end

  private

  def reprocess_avatar
    avatar.reprocess!
  end
end
