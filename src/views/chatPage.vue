<template>
  <div id="chat">
    <h1>{{ cont.nickname }}</h1>
    <div class="chats" ref="chats">
      <div v-for="(message, index) in messages" :key="index">
        <div class="from" v-if="message.from">
          <img :src="'http://' + this.$baseURL + this.user.pic" alt="" />
          <div>{{ message.msg }}</div>
        </div>
        <div class="to" v-else>
          <img :src="'http://' + this.$baseURL + this.cont.pic" alt="" />
          <div>{{ message.msg }}</div>
        </div>
      </div>
    </div>
    <div class="inputBox">
      <input type="text" v-model="text" />
      <button @click="send">发送</button>
    </div>
    <button
      class="back"
      v-if="this.$ismobile"
      @click="
        this.$parent.chating = false;
        this.$parent.selectedIndex = null;
      "
    >
      ≪
    </button>
  </div>
</template>

<script>
import axios from "axios";
import { md5 } from "js-md5";
import AES from "@/api/AES";
/* global BigInt */

export default {
  name: "chat-page",
  props: ["user", "cont"],
  watch: {
    cont: function () {
      this.messages = [];
      this.generateKeyServer();
      this.generateKeyClient();
      this.getmessages();
    },
  },
  data: function () {
    return {
      messages: [],
      text: "",

      keyClinet: {},
      ec: BigInt("0"),
      keyServer: "",
    };
  },
  mounted: function () {
    let that = this;
    this.$parent.socket.onmessage = function (msg) {
      let data = JSON.parse(msg.data);
      if (data.type == "check") {
        let conf;
        conf = confirm("是否同意" + data.from + "的好友申请");
        if (conf) {
          axios({
            method: "put",
            params: {
              uno: data.from,
              cno: that.user.jobno,
            },
            url: "/contact/agree",
            baseURL: "http://" + that.$baseURL,
          })
            .then((res) => {
              that.$parent.contacts.push(res.data.data);
            })
            .catch((err) => {
              console.error(err);
            });
        }
      } else if (data.type == "msg") {
        if (data.from == that.cont.jobno) {
          that.messages.push({
            from: false,
            msg: AES.decrypt(data.msg, that.keyClinet[that.cont.jobno]),
          });
        }
      } else if (data.type == "broadcast") {
        if (that.user.jobno != "000") alert(data.msg);
      } else if (data.type == "key") {
        let G = 81339n;
        let P = 1000000001339n;
        if (data.to == that.user.jobno) {
          let ec = BigInt(Math.floor(Math.random() * 900 + 100).toString());
          let key = (G ** ec % P).toString();
          let msg = {
            uno: data.to,
            cno: data.from,
            text: { type: "key", key: key, from: data.from, to: data.to },
          };
          that.$parent.socket.send(JSON.stringify(msg));
          that.keyClinet[data.from] = md5(
            (BigInt(data.key) ** ec % P).toString()
          );
          console.log("对" + data.from + "密钥生成");
        } else {
          that.keyClinet[data.to] = md5(
            (BigInt(data.key) ** that.ec % P).toString()
          );
          console.log("对" + data.to + "密钥生成");
        }
      }
    };
  },
  methods: {
    getmessages: function () {
      axios({
        method: "get",
        params: {
          uno: this.user.jobno,
          cno: this.cont.jobno,
        },
        url: "/messages/getmessages",
        baseURL: "http://" + this.$baseURL,
      }).then((res) => {
        res.data.data.forEach((element) => {
          this.messages.push({
            from: element.uno == this.user.jobno,
            msg: AES.decrypt(element.text, this.keyServer),
          });
          this.$nextTick = this.scroll();
        });
      });
    },
    send: function () {
      if (!this.cont.jobno) {
        alert("请选择聊天对象");
      } else if (!this.text) {
        alert("请输入文本内容");
      } else if (!this.cont.agree) {
        axios({
          method: "get",
          params: {
            uno: this.user.jobno,
            cno: this.cont.jobno,
          },
          url: "/contact/getagree",
          baseURL: "http://" + this.$baseURL,
        }).then((res) => {
          if (res.data.data) {
            this.$parent.contacts[this.$parent.selectedIndex].agree = true;
            this.send();
          } else {
            this.$parent.sendrequest(this.cont.jobno);
            alert("对方还未同意好友申请，已发送好友请求");
          }
        });
      } else {
        if (!this.keyClinet[this.cont.jobno]) {
          this.generateKeyClient();
        }
        if (this.keyClinet[this.cont.jobno]) {
          let msg = {
            uno: this.user.jobno,
            cno: this.cont.jobno,
            text: {
              type: "msg",
              msg: AES.encrypt(this.text, this.keyClinet[this.cont.jobno]),
              from: this.user.jobno,
            },
          };
          this.$parent.socket.send(JSON.stringify(msg));
        }
        this.messages.push({
          from: true,
          msg: this.text,
        });
        this.$nextTick = this.scroll();
        axios({
          method: "post",
          params: {
            uno: this.user.jobno,
            cno: this.cont.jobno,
            text: AES.encrypt(this.text, this.keyServer),
          },
          url: "/messages/addmessage",
          baseURL: "http://" + this.$baseURL,
        });
        this.text = "";
      }
    },
    scroll: function () {
      let div = this.$refs.chats;
      setTimeout(() => {
        if (div.scrollHeight > div.clientHeight) {
          div.scrollTop = div.scrollHeight;
        }
      }, 0);
    },
    generateKeyServer: function () {
      let G = 81339n;
      let P = 1000000001339n;
      let es = BigInt(Math.floor(Math.random() * 900 + 100).toString());
      let key = (G ** es % P).toString();
      axios({
        method: "post",
        params: {
          jobno: this.user.jobno,
          Ka: key,
        },
        url: "/key/generate",
        baseURL: "http://" + this.$baseURL,
      })
        .then((res) => {
          this.keyServer = md5((BigInt(res.data.data) ** es % P).toString());
          console.log("对服务器密钥生成");
        })
        .catch((err) => {
          console.error(err);
        });
    },
    generateKeyClient: function () {
      let G = 81339n;
      let P = 1000000001339n;
      this.ec = BigInt(Math.floor(Math.random() * 900 + 100).toString());
      let key = (G ** this.ec % P).toString();
      let msg = {
        uno: this.user.jobno,
        cno: this.cont.jobno,
        text: {
          type: "key",
          key: key,
          from: this.user.jobno,
          to: this.cont.jobno,
        },
      };
      this.$parent.socket.send(JSON.stringify(msg));
    },
  },
};
</script>

<style scoped>
#chat {
  width: 100%;
  height: 100vh;
  padding: 10px;
  box-sizing: border-box;
}

#chat h1 {
  text-align: center;
  color: var(--primary-secondery);
  margin-bottom: 10px;
}

.chats {
  width: calc(100% - 4px);
  height: 83%;
  border: 2px solid var(--primary-secondery);
  border-radius: 10px;
  overflow-y: scroll;
  scroll-behavior: smooth;
  padding: 10px;
  box-sizing: border-box;
}

.inputBox {
  margin-top: 10px;
  height: 43px;
  border: 2px solid var(--primary-secondery);
  border-radius: 10px;
}

.inputBox button {
  float: right;
  height: 100%;
  width: 80px;
  padding: 8px 20px;
  background: var(--primary-secondery);
  border-radius: 0 10px 10px 0;
  font-size: 1em;
  color: var(--neutral-main);
  transition: all 0.3s;
}

.inputBox button:hover {
  background: var(--primary-main);
  color: var(--neutral-secondery);
  transition: all 0.3s;
}

.inputBox input {
  height: 100%;
  width: calc(98% - 80px);
  box-sizing: border-box;
  padding: 10px;
  font-size: 1em;
  border-radius: 10px 0 0 10px;
}

.back {
  position: fixed;
  left: 10px;
  top: 10px;
  font-size: 1.5em;
  background-color: transparent;
  color: var(--primary-secondery);
  font-weight: 1000;
}

.from {
  float: right;
  width: 100%;
  margin-bottom: 20px;
}

.from img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  float: right;
  margin-left: 10px;
}

.from div {
  background-color: var(--primary-secondery);
  color: var(--neutral-main);
  padding: 10px;
  border-radius: 10px;
  float: right;
  max-width: 70%;
  word-break: break-all;
}

.to {
  float: left;
  width: 100%;
  margin-bottom: 20px;
}

.to img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  float: left;
  margin-right: 10px;
}

.to div {
  background-color: var(--primary-main);
  color: var(--neutral-secondery);
  padding: 10px;
  border-radius: 10px;
  float: left;
  max-width: 70%;
  word-break: break-all;
}
</style>