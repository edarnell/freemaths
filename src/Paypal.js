import React, { Component } from 'react'
//import paypal from 'paypal-checkout'
import ReactDOM from 'react-dom'
import scriptLoader from 'react-async-script-loader'
import {ajax} from './ajax'
//import PropTypes from 'prop-types';
//import PaypalExpressBtn from 'react-paypal-express-checkout'
//epdarnell_api1.gmail.com
//WZGKW4QVBAETUSBV
//Live AcypejKOIuBG3CE2Ccz03TFBt1c04SWjjr5o_z4BNFavvMi8jr9-VWvzXtkjv_xbz7VRuMk860BLyy47
//Sandbox ClientID AcZXvdzKQ7AvTeUhkuVNnAWopsKoDGwZ-TK9tUZ5iJ4WWKgVsyKKx1yMjFew23tZ86eaFihU2KeSn7Qr

class PaypalButton extends Component {
  constructor(props) {
      super(props);
      window.React = React;
      window.ReactDOM = ReactDOM;
      this.state = {
           showButton: false
       }
  }
  componentWillReceiveProps ({ isScriptLoaded, isScriptLoadSucceed }) {
      if (!this.state.showButton) {
          if (isScriptLoaded && !this.props.isScriptLoaded) {
              if (isScriptLoadSucceed) {
                  this.setState({ showButton: true });
                  console.log('loaded Paypal script');
              } else {
                  console.log('Cannot load Paypal script!');
                  this.props.onError();
              }
          }
      }
  }

  componentDidMount() {
      const { isScriptLoaded, isScriptLoadSucceed } = this.props;
      if (isScriptLoaded && isScriptLoadSucceed) {
          this.setState({ showButton: true });
          //console.log('loaded Paypal script!');
      }
  }
/*  componentDidMount() {
    window.paypal.Button.render({

        env: 'sandbox', // 'production' or 'sandbox'

        client: {
            sandbox:    'AcZXvdzKQ7AvTeUhkuVNnAWopsKoDGwZ-TK9tUZ5iJ4WWKgVsyKKx1yMjFew23tZ86eaFihU2KeSn7Qr',
            production: 'AcypejKOIuBG3CE2Ccz03TFBt1c04SWjjr5o_z4BNFavvMi8jr9-VWvzXtkjv_xbz7VRuMk860BLyy47'
        },

        commit: true, // Show a 'Pay Now' button

        payment: function(data, actions) {
            return actions.payment.create({
                transactions: [
                    {
                        description:"Basics",amount: {total: '10.00', currency: 'GBP' }
                    }
                ]
            },{input_fields: {no_shipping: 1}})
        },
        onAuthorize: function(data, actions) {
            return actions.payment.execute().then(function(payment) {

                // The payment is complete!
                // You can now show a confirmation message to the customer
            });
        }

    }, '#paypal-button');
  }*/
  render()
  {
    const client = {
      sandbox:    'AcZXvdzKQ7AvTeUhkuVNnAWopsKoDGwZ-TK9tUZ5iJ4WWKgVsyKKx1yMjFew23tZ86eaFihU2KeSn7Qr',
      production: 'AcypejKOIuBG3CE2Ccz03TFBt1c04SWjjr5o_z4BNFavvMi8jr9-VWvzXtkjv_xbz7VRuMk860BLyy47'
    }
    const payment = (data, actions)=> {
        return actions.payment.create({
            transactions: [
                {
                    description:"GCSE Master Classes",
                    amount: {total: this.props.total, currency: 'GBP' }
                }
            ]
        },{input_fields: {no_shipping: 1}})
    }
    let order=this.props.order,total=this.props.total
    let confirm=this.props.confirm
    const onAuthorize = (data, actions)=> {
        return actions.payment.execute().then(function(payment) {
          //console.log("Payment",payment,order,total)
          ajax('/react_ajax/paypal',(resp)=>{confirm(payment,order,resp.booked)},{event: '£✓', data: payment, order: order, total: total})

            // The payment is complete!
            // You can now show a confirmation message to the customer
        })
    }
    let cancel=this.props.cancel
    const onCancel= (data)=> {
      //console.log("Cancel",data)
      ajax('/react_ajax/paypal',()=>{cancel(data)},{event: '£✗', data: data, order: order, total: total})
    }
    //<PaypalExpressBtn client={client} currency={'GBP'} total={10.00} />
    return this.state.showButton?<window.paypal.Button.react
            env={'production'}
            client={client}
            payment={payment}
            commit={true}
            onAuthorize={onAuthorize}
            onCancel={onCancel}
            />
            :null
      }
}

//export default PaypalButton
export default scriptLoader('https://www.paypalobjects.com/api/checkout.js')(PaypalButton)
