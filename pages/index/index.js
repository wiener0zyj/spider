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
      connected: '',
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
    let btInfo = JSON.parse(JSON.stringify(_this.data.bluetooth));
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
                //console.log(btInfo);
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
  },
  connectRobot(e){
    console.log(e);
    const _this = this;
    const chooseddevice = e.currentTarget.dataset['bluetooth'];
    let btInfo = JSON.parse(JSON.stringify(_this.data.bluetooth));
    wx.showModal({
      title: '提示',
      content:"确定连接此设备吗？",
      success:function(res){
        if(res.confirm){
          wx.showLoading({
            title: "连接中..."
          });
          wx.createBLEConnection({
            deviceId: chooseddevice.deviceId,
            success(res){
              console.log("蓝牙连接成功");
              btInfo.connected = chooseddevice;
              btInfo.finding = false;
              //1. 获取此蓝牙设备的serviceId
              wx.getBLEDeviceServices({
                deviceId: chooseddevice.deviceId,
                success (res) {
                  console.log('device services:', res.services);
                  btInfo.connected.serviceId =  res.services[1].uuid;
                  //2. 获取此蓝牙设备的Characteristics
                  wx.getBLEDeviceCharacteristics({
                    deviceId: chooseddevice.deviceId,
                    serviceId: btInfo.connected.serviceId,
                    success:function(res){
                      console.log('res.characteristics', res.characteristics);
                      console.log('res.characteristics[0]', res.characteristics[0]);
                      btInfo.connected.characteristicId = res.characteristics[0].uuid;
                      //3. 关闭蓝牙搜索
                      wx.stopBluetoothDevicesDiscovery({});
                      _this.setData({
                        bluetooth: btInfo
                      });
                    }
                  });
                }
              });
            },
            fail(e){
              console.log(e);
              console.log("蓝牙连接失败!");
              wx.hideLoading({
                success: (res) => {
                  wx.showToast({
                    title: '连接失败',
                  });
                },
              });
            },
            complete(){
              wx.hideLoading({});
            }
          });
        }
      }
    });
  },
  setbluetooth(){
    const _this = this;
    let btInfo = JSON.parse(JSON.stringify(_this.data.bluetooth));
    wx.showActionSheet({
      itemList: ['断开连接'],
      success (res) {
        if(res.tapIndex === 0){
          //断开连接
          wx.showLoading({
            title: '断开连接',
          });
          wx.closeBLEConnection({
            deviceId: _this.data.bluetooth.connected.deviceId,
            success(){
              btInfo.connected = '';
              btInfo.finding = true;
              _this.setData({
                bluetooth: btInfo
              });
            }
          });
        }
        wx.showToast({
          title: res.tapIndex,
        });
      },
      complete(){
        wx.hideLoading({});
      }
    });
  },
  makecommand(e){
    const _this = this;
    const command = e.currentTarget.dataset['command'];
    let buffer = new ArrayBuffer(1);
    if(command === 'front'){
      buffer[0] = 'f';
    }else if(command === 'back'){
      buffer[0] = 'b';
    }else if(command === 'left'){
      buffer[0] = 'l';
    }else if(command === 'right'){
      buffer[0] = 'r';
    }else if(command === 'stand'){
      buffer[0] = 's';
    }else if(command === 'sit'){
      buffer[0] = 'i';
    }else if(command === 'wave'){
      buffer[0] = 'w';
    }else if(command === 'shake'){
      buffer[0] = 'h';
    }

    wx.writeBLECharacteristicValue({
      deviceId: this.data.bluetooth.connected.deviceId,
      serviceId: this.data.bluetooth.connected.serviceId,
      characteristicId: this.data.bluetooth.connected.characteristicId,
      value:buffer,
      success (res) {
        console.log('writeBLECharacteristicValue success', res.errMsg)
      },fail(e){
        console.log('writeBLECharacteristicValue fail', e)
      }
    });

  }
})
