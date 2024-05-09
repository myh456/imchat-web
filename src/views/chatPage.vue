<template>
  <div id="chat">
    <h1>{{ cont.nickname }} {{ user.jobno }}</h1>
    <div class="chats">
      <div v-for="(msg, index) in messages" :key="index">
        <div class="from" v-if="msg.from">[from]{{ msg.msg }}</div>
        <div class="to" v-else>[to]{{ msg.msg }}</div>
      </div>
    </div>
    <div class="inputBox">
      <input type="text" v-model="text" />
      <button @click="send">发送</button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "chat-page",
  props: ["user", "cont"],
  watch: {
    cont: function () {
      this.$parent.refreshkey();
    },
  },
  data: function () {
    return {
      messages: [],
      text: "",
    };
  },
  mounted: function () {
    let that = this;
    this.$parent.socket.onmessage = function (msg) {
      console.log(msg.data);
      let data = JSON.parse(msg.data);
      if (data.type == "on") {
        let i = that.$parent.contacts.findIndex((n) => {
          n.jobno == data.uno;
        });
        if (i != -1) {
          alert(that.$parent.contacts[i].nickname, "上线了");
        }
      } else if (data.type == "off") {
        let i = that.$parent.contacts.findIndex((n) => {
          n.jobno == data.uno;
        });
        if (i != -1) {
          alert(that.$parent.contacts[i].nickname, "下线了");
        }
      } else if (data.type == "check") {
        // todo
        // 返回结果
      } else if (data.type == "checked") {
        axios({
          method: "put",
          params: {
            user: that.user,
          },
          url: "/update/password",
          baseURL: "http://" + this.$baseURL,
        });
      } else if (data.type == "msg") {
        console.log(data.msg);
        that.messages.push({
          from: false,
          msg: data.msg,
        });
      }
    };
  },
  methods: {
    send: function () {
      if (!this.cont.jobno) {
        alert("请选择聊天对象");
      } else if (!this.text) {
        alert("请输入文本内容");
      } else {
        let msg = {
          from: this.user.jobno,
          to: this.cont.jobno,
          text: { type: "msg", msg: this.text },
        };
        this.$parent.socket.send(JSON.stringify(msg));
        this.messages.push({
          from: true,
          msg: this.text,
        });
        console.log(this.messages);
        this.text = "";
      }
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
}

.inputBox {
  margin-top: 10px;
  height: 6%;
  border: 2px solid var(--primary-secondery);
  border-radius: 10px;
}

.inputBox button {
  float: right;
  height: 100%;
  width: 9%;
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
  width: 91%;
  box-sizing: border-box;
  padding: 10px;
  font-size: 1em;
  border-radius: 10px 0 0 10px;
}
</style>