class UsersController < ApplicationController
  before_filter :set_user, except: [:index, :new, :create]

  def create
    @user = User.new(params[:user])
    if @user.save!
      respond_to do |format|
        format.html do
          flash[:notice] = "Successfully created user."
          redirect_to @user
        end
      end
    else
      respond_to do |format|
        format.html { render :action => "new" }
        format.json { render :json => @user.errors, :status => :unprocessable_entity }
      end
    end
  end

  def upload_avatar
    if @user.update_attributes(params[:user])
      render json: {files: [@user.to_jq_upload]}, :content_type => request.format, status: :created, location: @user
    end
  end

  def update
    if @user.update_attributes(params[:user])
      flash[:notice] = "Successfully updated user."
      redirect_to @user
    else
      flash[:notice] = "Error."
      redirect_to @user
    end
  end

  def index
    @users = User.all
  end

  def show
  end

  def new
    @user = User.new
  end

  def edit
  end

  def destroy
    @user.destroy
    flash[:notice] = "Successfully destroyed user."
    redirect_to users_url
  end

  private
  def set_user
    @user = User.find(params[:id])
  end
end
