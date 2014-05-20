class Image < ActiveRecord::Base

  mount_uploader :image, ImageUploader
  # Associations
  belongs_to :user
  # belongs_to :gallery

  attr_accessible :description, :gallery_id, :image, :title, :user_id
end
