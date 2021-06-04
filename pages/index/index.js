// index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'), // 如需尝试获取用户信息可改为false
    //蓝牙相关
    bluetooth:{
      connected: "",
      foundlist:[],
      finding:true    //是否正在搜索蓝牙
    }
  },
  // 事件处理函数
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad() {
    //1. 用户信息
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    //2. 蓝牙信息
    this.bluetoothSearch();
  },
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  getUserInfo(e) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    console.log(e)
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  //搜索附近的蓝牙
  ab2hex(buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function(bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  },
  bluetoothSearch(){
    const _this  = this;
    console.log("start bluetooth searching");
    wx.openBluetoothAdapter({
      success (res) {
        console.log(res);
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey:true,
          powerLevel:'high',
          success (res) {
            console.log(res);
            wx.onBluetoothDeviceFound(function(res) {
              var devices = res.devices;
              //console.log('new device list has founded')
              //console.dir(devices);
              devices.forEach(function(item){
                //console.log(item.name +  '  ' + item.deviceId);
                let btInfo = JSON.parse(JSON.stringify(_this.data.bluetooth));
                if(btInfo.foundlist.length == 0){
                  btInfo.foundlist.push(item);
                }else{
                  if(btInfo.foundlist.filter(jtem => item.deviceId === jtem.deviceId).length === 0){
                    btInfo.foundlist.push(item);
                  }
                  _this.setData({
                    bluetooth: btInfo
                  });
                }
              });
              //console.log(_this.ab2hex(devices[0].advertisData))
            });
          },
          fail(e){
            console.log("蓝牙搜索失败");
            console.log(e);
          }
        });
      },
      fail(e){
        console.log("蓝牙适配器初始化失败");
        console.log(e);
      }
    });
  }
})
