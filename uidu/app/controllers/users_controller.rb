class UsersController < ApplicationController


  def create
    @user = User.new(params[:user])
    respond_to do |format|
      if @user.save
        flash[:notice] = "Successfully created user."
        if params[:user][:avatar].blank?
          redirect_to @user
        else
          # render :action => 'crop'
          format.json { render json: {files: [@user.to_jq_upload]}, status: :created, location: @user }
        end
      else
        render :action => 'new'
      end
    end
  end

  def update
    @user = User.find(params[:id])
    if @user.update_attributes(params[:user])
      flash[:notice] = "Successfully updated user."
      if params[:user][:avatar].blank?
        redirect_to @user
      else
        render :action => 'crop'
      end
    else
      render :action => 'edit'
    end
  end

  def index
    @users = User.all
  end

  def show
    @user = User.find(params[:id])
  end

  def new
    @user = User.new
  end

  def destroy
    @user = User.find(params[:id])
    @user.destroy
    flash[:notice] = "Successfully destroyed user."
    redirect_to users_url
  end

end
