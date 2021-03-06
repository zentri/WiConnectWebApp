/*global Backbone:true, $:true, _:true, async:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

/*
  * WiConnect Web App, WiConnect JS API Library & WiConnect JS Build System
  *
  * Copyright (C) 2015, Sensors.com, Inc.
  * All Rights Reserved.
  *
  * The WiConnect Web App, WiConnect JavaScript API and WiConnect JS build system
  * are provided free of charge by Sensors.com. The combined source code, and
  * all derivatives, are licensed by Sensors.com SOLELY for use with devices
  * manufactured by ACKme Networks, or approved by Sensors.com.
  *
  * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS AND ANY EXPRESS OR IMPLIED
  * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
  * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
  * SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
  * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
  * OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
  * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
  * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
  * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY
  * OF SUCH DAMAGE.
*/

App.Views.Connect = Backbone.View.extend({
  els: [],
  views: [],
  template: _.template('\
<div class="content">\
<h1>Connect</h1>\
<button class="btn btn-lg active scan">Scan</button>\
<div class="wifi-scan wifi-logo">\
<div class="wifi-bar"></div>\
<div class="wifi-bar"></div>\
<div class="wifi-bar"></div>\
<div class="wifi-bar"></div>\
</div>\
<div class="wifi-scan status">Scanning</div>\
<div class="networks"></div>\
<div class="no-results">No networks found.<br>Click Rescan to try again.</div>\
<div class="clear"></div>\
</div>'),
  initialize: function(opts){
    _.bindAll(this, 'render', 'onClose', 'onScan', 'onResults');
    this.delegateEvents();

    this.controller = opts.controller;
    this.device = opts.device;

    this.listenTo(this.controller, 'change:view', this.render);
    this.render();
  },
  onClose: function(){
    this.stopListening();
  },
  events: {
    'click .scan': 'onScan',
    'click .network': 'onNetwork'
  },
  onScan: function() {
    var self = this;

    if(this.connectView){
      this.connectView.onClose();
      $(this.el).find('.connect-modal').empty();
    }

    this.$('.scan')
      .text('Scanning...')
      .removeClass('active')
      .addClass('scanning');

    this.networks = [];
    this.$('.networks').empty();
    this.$('.wifi-scan').addClass('scanning');

    var scanComplete = function(err, resp) {
      _.each(resp.response.split('\r\n'), function(line) {
        if(line.length === 0) {
          return;
        }

        line = line.replace(/\s{2,}/g, ' ').split(' ');

        if(line[0] === '!') {
          return;
        }

        if(Number(line[8]) === 0) {
          //hidden ssid
          return;
        }

        var network = {
          id: Number(line[1]),
          channel: Number(line[2]),
          rssi: Number(line[3]),
          bssid: line[4],
          security: line[6],
          ssid: _.rest(line, 9).join(' ')
        };

        self.networks.push(network);
      });

      self.onResults();
    };

    self.device.issueCommand(
      {property: 'mdns', cmd: 'get', args: {args: 'md n', ret: false}},
      function(err, res) {
        self.device.wiconnect.scan({args: '-v', timeout: 20000}, scanComplete);
      });

  },
  onResults: function() {
    var self = this;

    $(this.el).find('.scan')
      .text('Rescan')
      .removeClass('scanning')
      .addClass('active');

    $(this.el).find('.wifi-scan').removeClass('scanning');

    if(this.networks.length === 0) {
      $('.no-results').show();
      return;
    }
    $('.no-results').hide();

    var nwks = $(self.el).find('.networks');


    _.each(_.sortBy(this.networks, function(n) {return -n.rssi;}), function(network) {
      self.views.push(new App.Views.Network({
        network: network,
        el: $('<div />')
          .addClass('network')
          .attr('data-network', network.id)
          .appendTo(nwks)
      }));
    });

    nwks.slideDown(125);
  },
  onNetwork: function(e) {
    var self = this;

    if(this.connectView){
      this.connectView.onClose();
    }

    this.connectView = new App.Views.QuickConnect({
      device: this.device,
      controller: this.controller,
      network: _.findWhere(this.networks, {id: $(e.currentTarget).data('network')}),
      el: $('<div />')
        .addClass('connect-modal modal')
        .appendTo(this.$el)
    });

  },
  render: function() {
    var self = this;

    if(this.controller.get('view') !== 'connect'){
      $(this.el).removeClass('active');
      return;
    }

    this.$el.html(this.template()).addClass('active');

    self.onScan();
  }
});



App.Views.QuickConnect = Backbone.View.extend({
  els: [],
  views: [],
  template: _.template('\
<div class="content">\
<h2><%- ssid %></h2>\
<div>\
<h4>BSSID</h4>\
<input name="bssid" value="<%- bssid %>" disabled></input>\
</div>\
<div>\
<h4>Password</h4>\
<input name="password" type="password" value="" autocapitalize="off"></input>\
</div>\
<div class="right">\
<h5>show password</h5>\
<div class="wiconnect-cbx secondary small">\
<input type="checkbox" value="show-password" id="show-password" name="show-password" />\
<label for="show-password"></label>\
</div>\
</div>\
<div class="reconnect">\
<div class="wiconnect-cbx small-margin">\
<input type="checkbox" value="None" id="reconnect" name="reconnect"/>\
<label for="reconnect"></label>\
</div>\
<h4>Reconnect to device</h4>\
</div>\
<div class="mdns">\
<div>\
<h4>Device Name</h4>\
<input name="mdns" placeholder="ackme-<%= mac %>" value="<%= mdns %>"></input>\
</div>\
</div>\
<div>\
<div class="wiconnect-cbx">\
<input type="checkbox" value="None" id="show-advanced" name="show-advanced" />\
<label for="show-advanced"></label>\
</div>\
<h4>Advanced Settings</h4>\
</div>\
<div class="advanced">\
<div>\
<button class="btn btn-lg btn-ip btn-dhcp active pressed col-50">DHCP</button>\
<button class="btn btn-lg btn-ip btn-static col-50">Static</button>\
</div>\
<div class="static">\
<div>\
<h4>IP</h4>\
<input name="ip" class="ipv4" value=""></input>\
</div>\
<div>\
<h4>Gateway</h4>\
<input name="gateway" class="ipv4" value=""></input>\
</div>\
<div>\
<h4>DNS</h4>\
<input name="dns" class="ipv4" value=""></input>\
</div>\
<div>\
<h4>Netmask</h4>\
<input name="netmask" class="ipv4" value=""></input>\
</div>\
</div>\
</div>\
<div>\
<button class="btn btn-lg cancel">Cancel</button>\
<button class="btn btn-lg save">Connect</button>\
</div>\
<div class="clear"></div>\
</div>'),
  initialize: function(opts){
    _.bindAll(this, 'render', 'onClose',
              'onReconnect', 'onAdvanced', 'onAddressing', 'onPassword',
              'onIPv4',
              'onCancel', 'onSave', 'onSetupExit'
              );

    this.delegateEvents();

    this.network = opts.network;
    this.device = opts.device;
    this.controller = opts.controller;

    this.render();
  },
  onClose: function(){
    this.stopListening();
  },
  events: {
    'change #reconnect': 'onReconnect',
    'change #show-advanced': 'onAdvanced',
    'change #show-password': 'onPassword',
    'click .btn-ip': 'onAddressing',
    'blur .ipv4': 'onIPv4',
    'keyup .ipv4.invalid': 'onIPv4',
    'click .cancel': 'onCancel',
    'click .save': 'onSave'
  },
  onCancel: function() {
    $('.connect>.content').show();

    this.remove();
  },
  onIPv4: function(e) {
    var thisAdd = $(e.currentTarget);

    var IPv4 = new RegExp(/((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}/);

    if(!IPv4.test(thisAdd.val())){
      return thisAdd.addClass('invalid');
    }

    thisAdd.removeClass('invalid');
  },

  onPassword: function(e) {
    if($(this.el).find('#show-password').is(':checked')) {
      $(this.el).find('input[name="password"]').attr('type', 'text');
      return;
    }
    $(this.el).find('input[name="password"]').attr('type', 'password');
  },

  onReconnect: function(e) {
    $(this.el).find('.mdns').slideToggle(125);
  },

  onAdvanced: function(e) {
    $(this.el).find('.advanced').slideToggle(125);
  },

  onAddressing: function(e) {
    var thisBtn = $(e.currentTarget);
    $(this.el).find('.btn-ip.active').removeClass('active pressed');
    thisBtn.addClass('active pressed');

    if(!thisBtn.hasClass('btn-static')){
      return $(this.el).find('.static').slideUp(125);
    }

    $(this.el).find('.static').slideDown(125);
  },

  onSave: function() {
    var self = this;

    var cmds = [];

    self.reconnect = $($(this.el).find('input[name="reconnect"]')[0]).is(':checked');

    var advanced = $($(this.el).find('input[name="show-advanced"]')[0]).is(':checked');

    var password = $(this.el).find('input[name="password"]').val();
    cmds = [
      {cmd: 'set', args: {args:'wl s \"' + self.network.ssid + '\"'}},
      {cmd: 'set', args: {args:'wl p \"' + password + '\"'}}
    ];

    if(advanced){
      var dhcp = _.contains($(this.el).find('button.btn-ip.active')[0].classList, 'btn-dhcp');

      cmds.push({cmd: 'set', args: {args: 'ne d e ' + (dhcp ? 1 : 0)}});

      if(!dhcp){
        var ip      = $(this.el).find('input[name="ip"]').val();
        var gateway = $(this.el).find('input[name="gateway"]').val();
        var dns     = $(this.el).find('input[name="dns"]').val();
        var netmask = $(this.el).find('input[name="netmask"]').val();

        cmds.push({cmd: 'set', args: {args:'st i ' + ip}});
        cmds.push({cmd: 'set', args: {args:'st g ' + gateway}});
        cmds.push({cmd: 'set', args: {args:'st d ' + dns}});
        cmds.push({cmd: 'set', args: {args:'st n ' + netmask}});
      }
    }

    if(self.device.get('web_setup')) {
      cmds.push({cmd: 'set', args: {args:'wl o e 1'}});

      if(self.reconnect){
        var mdns = $(this.el).find('input[name="mdns"]').val().trim();
        var mac = self.device.get('mac');
        mac = mac.substring(mac.length - 4).replace(':','');

        mdns = mdns.length > 0 ? mdns : 'ackme-' + mac;
        mdns = mdns.toLowerCase();

        self.mdns = mdns;

        cmds.push({cmd: 'set', args: {args:'ht s e 1'}});
        cmds.push({cmd: 'set', args: {args:'md e 1'}});
        cmds.push({cmd: 'set', args: {args:'md n ' + mdns}});
        cmds.push({cmd: 'set', args: {args:'md s http'}});
        cmds.push({cmd: 'set', args: {args:'ht s c *'}});
      }
    }

    cmds.push({cmd: 'save'});

    if(self.device.get('web_setup')) {
      $('.networks').empty(); //clear network list
      cmds.push({cmd:'reboot'});
    } else {
      self.controller.loading(true);
    }


    var credentialFail = function(err, res) {
      return self.controller.modal({
        systemModal: true,
        content:'<h2>Failed to verify network password.</h2>',
        primaryBtn: {
          content: 'Save &amp; Continue',
          clickFn: function(modal) {
            saveSettings();
          }
        },
        secondaryBtn: {
          content: 'Check Password',
          class: 'cancel'
        }
      });
    };

    var saveSettings = function() {
      self.controller.modal({
        systemModal: true,
        content:'<h2>Waiting for device to connect to \'' + self.network.ssid + '\'...</h2><div class="progress-bar"><div class="progress"></div></div>'
      });

      async.eachSeries(
        cmds,
        self.device.issueCommand,
        function(err) {
          if(self.device.get('web_setup')){
            self.remove();
            return self.onSetupExit();
          }

          if(err){
            //handle err
          }

          self.controller.loading(false);

          $('.connect>.content').show();
          self.remove();
        });
    };

    var attempt = 1;

    var verifyCredentials = function() {
      self.device.wiconnect.nve(
        {args: 'wifi \"' + self.network.ssid + '\" ' + self.network.bssid.replace(/:/g,'') + ' ' + self.network.channel + ((self.device.securityTypes[self.network.security.toLowerCase()] > 0) ? ' ' + self.device.securityTypes[self.network.security.toLowerCase()] + ' ' + self.device.hashCredentials(password, self.network.ssid) : '')},
        function(err, res){
          if(res.response.replace('\r\n','') !== 'Success') {
            //timeout or Command Failed
            if(attempt >= 3){
              return credentialFail();
            }

            attempt += 1;

            //need to wait a few seconds to prevent eating all the beacons
            return setTimeout(verifyCredentials, 3000);
          }

          self.controller.modal({
            systemModal: true,
            content: '<h2>Success!<br>Your network password is correct.</h2>'
          });

          setTimeout(saveSettings, 2000);
        });
    };

    if(self.device.get('web_setup')) {
      self.controller.modal({systemModal: true, content:'<h2>Verifying password...</h2>'});
      return verifyCredentials();
    }

    saveSettings();
  },

  render: function() {
    var self = this;

    var data = this.network;
    var mac = self.device.get('mac');
    data.mac = mac.substring(mac.length - 4).replace(':','').toLowerCase();
    data.mdns = self.device.get('mdns').replace('\r\n', '');
    if(data.mdns[data.mdns.length-1] === '#'){
      data.mdns = data.mdns.substring(0, data.mdns.length-1) + data.mac;
    }

    this.$el.html(this.template(data));
    if(_.contains(['medium ', 'small'], this.controller.get('size'))) {
      $('.connect>.content').hide();
    }

    if(!self.device.get('web_setup')) {
      $('.reconnect').hide();
    }
  },

  onSetupExit: function() {
    var self = this;

    if(!self.reconnect){
      return self.controller.modal({content:'<h2>Device is now connecting to ' + this.network.ssid + '.</h2><h2>Setup is complete.</h2>'});
    }

    if(navigator.userAgent.indexOf('Android') >= 0) {
      return self.controller.modal({content:'<h2>Auto-discovery is not supported on Android.</h2><h2>Download the <a href="intent://#Intent;scheme=ackme_discovery;action=android.intent.action.VIEW;package=discovery.ack.me.ackme_discovery;end">ACKme Discovery</a> App from the Play store to find your device.</h2>'});
    }

    if(typeof self.setup === 'undefined') {
      self.setup = {
        attempt: 0,
        retries: 30
      };
    }

    var host = (navigator.platform === 'Win32') ? self.mdns : self.mdns + '.local';

    $.ajax({
        url: 'http://' + host + '/command/ver',
        type: 'GET',
        contentType: 'application/json',
        timeout: 2000
      })
      .fail(function() {
        if(self.setup.attempt > self.setup.retries){
          return self.controller.modal({content:'<h2>Unable to reconnect to device.<br><br> Please check you are connected to<br>\'' + self.network.ssid + '\'</h2>'});
        }

        self.setup.attempt += 1;
        $('.progress').css({width: String((self.setup.attempt / self.setup.retries)*100) + '%'});

        setTimeout(self.onSetupExit, 1000);
      })
      .done(function() {
        top.location = 'http://' + host + '/';
      });
  }
});
