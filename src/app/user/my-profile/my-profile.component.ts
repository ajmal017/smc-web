import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/interface/user';
import { GlobalService } from 'src/app/services/global.service';

@Component({
  selector: 'user-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss']
})
export class MyProfileComponent implements OnInit {
  isViewMode = true;
  userProfile: User;

  constructor(private _globalService: GlobalService) { }

  ngOnInit(): void {
    this.userProfile = this._globalService.currUser;
  }

  handleEditBtn(): void{
    this.isViewMode = false;
  }

  handleCancelUpdate(): void{
    this.userProfile = this._globalService.currUser;
    this.isViewMode = true;
  }

  handleSubmitUpdate(): void{
    this.userProfile = this._globalService.currUser;
    this.isViewMode = true;
    //tbd: request http user put method.
  }

}
