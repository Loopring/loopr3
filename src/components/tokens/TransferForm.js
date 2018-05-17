import React from 'react';
import { Input,Button,Form,Select,Popover,Slider,Icon} from 'antd';
import intl from 'react-intl-universal';
import config from 'common/config'
import * as datas from 'common/config/data'
import * as fm from 'LoopringJS/common/formatter'
import {calculateGas} from 'LoopringJS/common/utils'
import * as tokenFormatter from 'modules/tokens/TokenFm'
import contracts from 'LoopringJS/ethereum/contracts/Contracts'
import Currency from 'modules/settings/CurrencyContainer'

var _ = require('lodash');

function TransferForm(props) {
  const {transfer, balance, wallet, marketcap, form, modals} = props

  let tokenSelected = {}
  if(transfer.assignedToken) {
    tokenSelected = tokenFormatter.getBalanceBySymbol({balances:balance.items, symbol:transfer.assignedToken, toUnit:true})
  } else if(transfer.token) {
    tokenSelected = tokenFormatter.getBalanceBySymbol({balances:balance.items, symbol:transfer.token, toUnit:true})
  }
  let gasPrice = datas.configs.defaultGasPrice
  let gasLimit = config.getGasLimitByType('eth_transfer').gasLimit
  if(transfer.token && transfer.token !== "ETH") {
    gasLimit = config.getGasLimitByType('token_transfer').gasLimit
  }
  if(transfer.gasPopularSetting) {
    gasPrice = transfer.sliderGasPrice
  } else {
    if(transfer.selectedGasPrice) {
      gasPrice = transfer.selectedGasPrice
    }
    if(transfer.selectedGasLimit) {
      gasLimit = transfer.selectedGasLimit
    }
  }

  const gas = calculateGas(gasPrice, gasLimit);

  function validateTokenSelect(value) {
    const result = form.validateFields(["amount"], {force:true});
    if(value) {
      return true
    } else {
      return false
    }
  }

  function validateAmount(value) {
    if(transfer.token && tokenFormatter.isValidNumber(value)) {
      const token = tokenFormatter.getBalanceBySymbol({balances:balance.items, symbol:transfer.token, toUnit:true})
      const v = fm.toBig(value)
      return !v.lessThan(fm.toBig('0')) && !v.greaterThan(token.balance)
    } else {
      return false
    }
  }

  function handleChange(v) {
    if(v) {
      transfer.tokenChange({token:v})
    }
  }

  function amountChange(e) {
    if(e.target.value) {
      const v = fm.toNumber(e.target.value)
      transfer.setAmount({amount:v})
    }
  }

  function toContinue(e) {
    if(e.keyCode === 13) {
      e.preventDefault();
      handleSubmit()
    }
  }

  function handleSubmit() {
    form.validateFields((err, values) => {
      if (!err) {
        if(wallet.)
        const tx = {};
        tx.gasPrice = fm.toHex(fm.toBig(gasPrice).times(1e9))
        tx.gasLimit = fm.toHex(gasLimit)
        if(tokenSelected.symbol === "ETH") {
          tx.to = values.to;
          tx.value = fm.toHex(fm.toBig(values.amount).times(1e18))
          tx.data = fm.toHex(values.data);
        } else {
          const tokenConfig = config.getTokenBySymbol(tokenSelected.symbol)
          tx.to = tokenConfig.address;
          tx.value = "0x0";
          let amount = fm.toHex(fm.toBig(values.amount).times("1e"+tokenConfig.digits))
          tx.data = contracts.ERC20Token.encodeInputs('transfer', {_to:values.to, _value:amount});
        }
        const extraData = {from:'123', to:values.to, tokenSymbol:tokenSelected.symbol, amount:values.amount, gas:gas.toString(10)}
        modals.showModal({id:'transferConfirm', tx, extraData})
      }
    });
  }

  function selectMax(e) {
    e.preventDefault();
    transfer.setIsMax({isMax:true})
  }

  function gasSettingChange(e) {
    e.preventDefault();
    transfer.setGasPopularSetting({gasPopularSetting:!transfer.gasPopularSetting})
  }

  function setGas(v) {
    setTimeout(()=>{
      transfer.setSliderGasPrice({sliderGasPrice:v})
    },0)
  }

  function gasLimitChange(e) {
    if(e.target.value){
      transfer.setSelectedGasLimit({selectedGasLimit:fm.toNumber(e.target.value)})
    }
  }

  function gasPriceChange(e) {
    transfer.setSelectedGasPrice({selectedGasPrice:fm.toNumber(e)})
  }

  if(transfer.token && form.getFieldValue('amount') !== undefined && form.getFieldValue('amount') !== '') {
    let tokenBalance = tokenFormatter.getBalanceBySymbol({balances:balance.items, symbol:transfer.token, toUnit:true}).balance
    const formBalance = fm.toBig(form.getFieldValue('amount'))
    if(transfer.token === 'ETH') {
      if(transfer.isMax) {
        tokenBalance = tokenBalance.gt(gas) ?  tokenBalance.minus(gas) : fm.toBig(0);
      } else {
        tokenBalance = formBalance.add(gas).gt(tokenBalance) ? tokenBalance.minus(gas) : formBalance
      }
      if(!formBalance.equals(tokenBalance)) {
        form.setFieldsValue({"amount": tokenBalance.toString(10)})
      }
    } else {
      if(transfer.isMax && !formBalance.equals(tokenBalance)) {
        form.setFieldsValue({"amount": tokenBalance.toString(10)})
      }
    }
  }

  const assetsSorted = balance.items.map((token,index) => {
    return tokenFormatter.getBalanceBySymbol({balances:balance.items, symbol:token.symbol, toUnit:true})
  })
  assetsSorted.sort(tokenFormatter.sorter);

  const amountAfter = (<a href="" onClick={selectMax.bind(this)}>send_max</a>)

  const formatGas = (value) => {
    const gas = fm.toBig(value).times(fm.toNumber(gasLimit)).div(1e9).toString()
    return gas + " ETH";
  }

  const editGas = (
    <Popover overlayClassName="place-order-form-popover"
             title={
               <div className="row pt5 pb5">
                 <div className="col-auto">
                   {intl.get('token.custum_gas_title')}
                 </div>
                 <div className="col"></div>
                 <div className="col-auto"><a href="" onClick={gasSettingChange.bind(this)}>{transfer.gasPopularSetting ? 'gas_custom_setting' : 'token.gas_fast_setting' }</a></div>
               </div>
             }
             content={
               <div style={{maxWidth:'300px',padding:'5px'}}>
                 {transfer.gasPopularSetting &&
                 <div>
                   <div className="pb10">custum_gas_content</div>
                   <Form.Item className="mb0 pb10" colon={false} label={null}>
                     {form.getFieldDecorator('transactionFee', {
                       initialValue: datas.configs.defaultGasPrice, //TODO mock
                       rules: []
                     })(
                       <Slider min={1} max={99} step={0.01}
                               marks={
                                 {
                                  1: intl.get('token.slow'),
                                  99: intl.get('token.fast')
                                 }
                               }
                               tipFormatter={formatGas}
                               onChange={setGas.bind(this)}
                       />
                     )}
                   </Form.Item>
                 </div>
                 }
                 {!transfer.gasPopularSetting &&
                 <div>
                   <div className="pb10">custum_gas_advance_content</div>
                   <Form.Item label={<div className="fs3 color-black-2">{intl.get('token.gas_limit')}</div>} colon={false}>
                     {form.getFieldDecorator('gasLimit', {
                       initialValue: transfer.selectedGasLimit,
                       rules: [{
                         message:intl.get('trade.integer_verification_message'),
                         validator: (rule, value, cb) => _.isNumber(value) ? cb() : cb(true)
                       }],
                     })(
                       <Input className="d-block w-100" placeholder="" size="large" onChange={gasLimitChange.bind(this)}/>
                     )}
                   </Form.Item>
                   <Form.Item label={<div className="fs3 color-black-2">{intl.get('token.gas_price')}</div>} colon={false}>
                     {form.getFieldDecorator('gasPrice', {
                       initialValue: transfer.selectedGasPrice,
                       rules: []
                     })(
                       <Slider min={1} max={99} step={1}
                               marks={{
                                 1: intl.get('token.slow'),
                                 99: intl.get('token.fast')
                               }}
                               onChange={gasPriceChange.bind(this)}
                       />
                     )}
                   </Form.Item>
                 </div>
                 }
               </div>
             } trigger="click">
      <a className="fs12 pointer color-black-3 mr5"><Icon type="edit" /></a>
    </Popover>
  )

  return (
    <div className="form-dark">
        <div className="card-header bordered">
            <h4 className="text-dark">Send {tokenSelected && tokenSelected.symbol}</h4>
            <a href="#" className="close close-lg close-inverse" id="sendClose"></a>
        </div>
        <div className="card-body form-inverse">
            <Form>
              {
                !transfer.to &&
                <Form.Item colon={false} label="Token">
                  {form.getFieldDecorator('token', {
                    initialValue: '',
                    rules: [
                      {message: intl.get("token.token_select_verification_message"),
                        validator: (rule, value, cb) => validateTokenSelect(value) ? cb() : cb(true)
                      }
                    ]
                  })(
                    <Select
                      size="large"
                      showSearch={false}
                      allowClear
                      placeholder={intl.get('token.token_selector_placeholder')}
                      optionFilterProp="children"
                      onChange={handleChange.bind(this)}
                      onFocus={()=>{}}
                      onBlur={()=>{}}
                      filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
                      {assetsSorted.map((token,index) => {
                        const tokenBalance = tokenFormatter.getBalanceBySymbol({balances:balance.items, symbol:token.symbol, toUnit:true})
                        return <Select.Option value={token.symbol} key={index}>
                          <div className="row mr0">
                            <div className="col color-black-2">{token.symbol}</div>
                            <div className="col-atuo color-black-3">{tokenBalance.balance.gt(0) ? tokenBalance.balance.toString(10) : ''}</div>
                          </div>
                        </Select.Option>}
                      )}
                    </Select>
                  )}
                </Form.Item>
              }
              <Form.Item label='Recipient' colon={false}>
                {form.getFieldDecorator('to', {
                  initialValue: '',
                  rules: [
                    {message: intl.get("token.eth_address_verification_message"),
                      validator: (rule, value, cb) => tokenFormatter.validateEthAddress(value) ? cb() : cb(true)
                    }
                  ]
                })(
                  <Input placeholder="" size="large" onKeyDown={toContinue.bind(this)}/>
                )}
              </Form.Item>
              <Form.Item label='Amount' colon={false}>
                {form.getFieldDecorator('amount', {
                  initialValue: 0,
                  rules: [
                    {
                      message: intl.get('token.amount_verification_message'),
                      validator: (rule, value, cb) => validateAmount.call(this, value) ? cb() : cb(true)
                    }
                  ]
                })(
                  <Input className="d-block w-100" placeholder="" size="large"
                         suffix={amountAfter}
                         onChange={amountChange.bind(this)} onKeyDown={toContinue.bind(this)}
                         onFocus={() => {
                           const amount = form.getFieldValue("amount")
                           if (amount === 0) {
                             form.setFieldsValue({"amount": ''})
                           }
                         }}
                         onBlur={() => {
                           const amount = form.getFieldValue("amount")
                           if(amount === '') {
                             form.setFieldsValue({"amount": 0})
                           }
                         }}/>
                )}
              </Form.Item>
            </Form>
            <div className="text-color-dark-1">
                <div className="form-control-static d-flex justify-content-between mr-0">
                  <span>Gas Fee</span>
                  <span className="font-bold">
                    {editGas}
                    <span>0</span>
                    <span className="offset-md">{gas.toString(10)} ETH ≈ $1.15</span>
                  </span>
                </div>
            </div>
            <Button className="btn btn-o-dark btn-block btn-xlg" onClick={handleSubmit}>Continue</Button>
        </div>

    </div>
  )
}
export default Form.create()(TransferForm);
