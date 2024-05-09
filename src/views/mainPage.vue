<template>
  <div id="main" :class="this.$ismobile ? 'mobile' : 'computer'">
    <div class="info">
      <div class="pic">
        <img
          @click="this.$refs.fileInput.click()"
          :src="'http://' + this.$baseURL + user.pic"
          alt=""
        />
        <input
          type="file"
          accept="image/jpeg, image/png"
          ref="fileInput"
          @change="handleFileChange"
          style="display: none"
        />
      </div>
      <div class="name">
        <h2 v-show="!naming" @click="naming = !naming">
          {{ user.nickname }}
        </h2>
        <input
          v-show="naming"
          type="text"
          v-model="user.nickname"
          @focusout="rename"
        />
      </div>
      <div class="buttonBox">
        <button @click="logout">退出登录</button>
      </div>
    </div>

    <input
      placeholder="搜索用户"
      class="searchContact"
      type="text"
      v-model="searchinfo"
      @focus="
        searching = true;
        selectuser();
        this.selectedIndex = null;
      "
      @input="selectuser()"
      @blur="
        if (!searchinfo) {
          searching = false;
          this.selectedIndex = null;
          this.getcontacts();
        }
      "
    />

    <transition>
      <div id="searched" class="lists" v-show="searching">
        <ul v-for="(item, index) in allusers" :key="index">
          <li
            @click="this.selectedIndex = index"
            :class="{
              selected: selectedIndex === index,
              normal: selectedIndex !== index,
            }"
          >
            <div class="item" @click="requestcont(item.jobno)">
              <img :src="'http://' + this.$baseURL + item.pic" alt="" />
              <h2>{{ item.nickname }}</h2>
            </div>
          </li>
        </ul>
      </div>
    </transition>

    <transition>
      <div id="contacts" class="lists" v-show="!searching">
        <ul v-for="(item, index) in contacts" :key="index">
          <li
            @click="
              this.selectedIndex = index;
              this.chatwith = item;
            "
            :class="{
              selected: selectedIndex === index,
              normal: selectedIndex !== index,
            }"
          >
            <div class="item">
              <img :src="'http://' + this.$baseURL + item.pic" alt="" />
              <h2>{{ item.nickname }}</h2>
            </div>
          </li>
        </ul>
      </div>
    </transition>
  </div>
  <chat-page
    id="chat"
    :user="this.user"
    :cont="this.chatwith"
    v-if="!this.$ismobile"
    :key="refresh"
  >
  </chat-page>
</template>

<script>
import axios from "axios";
import chatPage from "./chatPage.vue";

export default {
  components: { chatPage },
  data() {
    return {
      user: {},
      chatwith: {},
      contacts: [],
      allusers: [],
      searchinfo: "",
      selectedIndex: null,
      ismobile: false,
      naming: false,
      searching: false,

      refresh: 0,
      socket: null,
    };
  },
  created() {
    // 获取本人信息
    if (!this.$cookies.isKey("user")) {
      this.$router.replace("/login");
    } else {
      this.user.jobno = this.$cookies.get("user").jobno;
      this.user.nickname = this.$cookies.get("user").nickname;
      this.user.pic = this.$cookies.get("user").pic;
      this.chatwith.nickname = "即时通信";
    }
    this.getcontacts();

    this.initsocket();
  },
  methods: {
    handleFileChange: function (e) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("jobno", this.user.jobno);
      formData.append("file", file);
      axios({
        method: "post",
        data: formData,
        url: "/user/changePic",
        baseURL: "http://" + this.$baseURL,
      })
        .then((responce) => {
          console.log(responce.data);
          var usr = this.$cookies.get("user");
          usr.pic = "/images/" + usr.jobno + ".png";
          this.$cookies.set("user", usr);
          location.href = "/main";
        })
        .catch((err) => {
          console.error(err);
        });
    },
    logout: function () {
      this.$cookies.remove("user");
      this.$router.push("/login");
    },
    rename: function () {
      this.naming = false;
      axios({
        method: "put",
        params: {
          jobno: this.user.jobno,
          nickname: this.user.nickname,
        },
        url: "/user/update/nickname",
        baseURL: "http://" + this.$baseURL,
      });
    },
    getcontacts: function () {
      axios({
        method: "get",
        params: {
          jobno: this.user.jobno,
        },
        url: "/contact/getcontacts",
        baseURL: "http://" + this.$baseURL,
      })
        .then((res) => {
          this.contacts = Array.from(res.data.data);
        })
        .catch((err) => {
          alert("未知错误，无法获取联系人，请联系管理员");
          console.error(err);
        });
    },
    selectuser: function () {
      axios({
        method: "get",
        params: {
          jobno: this.user.jobno,
          info: this.searchinfo,
        },
        url: "/user/selectusers",
        baseURL: "http://" + this.$baseURL,
      })
        .then((res) => {
          this.allusers = res.data.data;
        })
        .catch((err) => {
          alert("未知错误，无法获取指定用户，请联系管理员");
          console.error(err);
        });
    },
    requestcont: function (cont) {
      axios({
        method: "post",
        params: {
          uno: this.user.jobno,
          cno: cont,
        },
        url: "/contact/addcontact",
        baseURL: "http://" + this.$baseURL,
      });
      alert("已发送对话请求");
    },
    initsocket: function () {
      if (typeof WebSocket == "undefined") {
        console.log("浏览器不支持websocket");
      } else {
        console.log("浏览器支持websocket");
      }
      if (this.socket != null) {
        this.socket.close();
        this.socket = null;
      }
      let socketURL = "ws://localhost:8086/websocket/" + this.user.jobno;
      this.socket = new WebSocket(socketURL);
      this.socket.onopen = function () {
        console.log("websocket已打开");
      };
      this.socket.onclose = function () {
        console.log("websocket已关闭");
      };
      this.socket.onerror = function () {
        console.log("websocket发生了错误");
      };
    },
    refreshkey: function () {
      this.refresh++;
    },
  },
};
</script>

<style scoped>
#main {
  box-sizing: border-box;
  padding: 10px;
  height: 100vh;
  float: left;
  color: var(--neutral-main);
}

#chat {
  width: 75%;
  float: right;
}

.mobile {
  width: 100%;
}

.computer {
  width: 25%;
}

.info .pic {
  float: left;
}

.info .pic img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid var(--primary-secondery);
}

.info .name {
  float: left;
  padding: 7px 0px 7px 12px;
  width: 45%;
  white-space: nowrap;
}

.info input {
  font-size: 1.5em;
  font-weight: bold;
  width: 100%;
  color: var(--primary-main);
}

.info .name h2 {
  overflow: hidden;
  color: var(--primary-secondery);
  text-overflow: ellipsis;
}

.info .buttonBox {
  float: right;
  padding: 3px;
}

.buttonBox button {
  padding: 8px 20px;
  border-radius: 10px;
  background: none;
  font-size: 1em;
  color: var(--primary-secondery);
  border: 2px solid var(--primary-secondery);
  transition: all 0.3s;
}

.buttonBox button:hover {
  color: var(--primary-main);
  border: 2px solid var(--primary-main);
  transition: all 0.3s;
}

input.searchContact {
  font-size: 1em;
  border-radius: 10px;
  border: 2px solid var(--primary-secondery);
  transition: all 0.3s;
  padding: 10px;
  width: calc(100% - 20px - 4px);
}

input.searchContact::placeholder {
  color: var(--primary-secondery);
}

input.searchContact:focus {
  border: 2px solid var(--primary-main);
  transition: all 0.3s;
}

.lists {
  margin-top: 10px;
  height: 82%;
  overflow: scroll;
  border: 2px solid var(--primary-secondery);
  border-radius: 10px;
}

.lists li {
  padding: 10px;
  border-radius: 10px;
  transition: all 0.3s;
}

.lists li.normal:hover {
  background-color: var(--primary-secondery);
  transition: all 0.3s;
}

.lists li.selected {
  background-color: var(--primary-main);
  color: var(--neutral-secondery);
  transition: all 0.3s;
}

.lists li::after {
  clear: both;
  display: table;
  content: "";
}

.lists li img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  float: left;
}

.lists li h2 {
  float: left;
  padding: 10px;
  width: 75%;
}

.v-enter-to,
.v-leave-from {
  opacity: 1;
  transition: opacity 0.2s;
}
.v-enter-from,
.v-leave-to {
  opacity: 0;
  transition: opacity 0.2s;
}
</style>