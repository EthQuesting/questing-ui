import React, { Component} from "react";
import '../App.scss'
import DropDownList from './DropDownList.js'
import SelectedReqItem from './SelectedReq.js'
import nfts from '../assets/erc721s.js'
import erc20s from '../assets/erc20s.js'
import cat from '../assets/img/ck.png'

class Create extends Component {
  constructor(props) {
    super(props);
    this.state = {
      step : 2,
      title : '',
      selectedReqs : new Set(),
      selectedPrize : '',
      titleError : false, 
      reqError : false,
      prizeError : false,
      amtError : false,
      amount : 0,
      nftSelected : false
    };
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this)
    this.togglePage = this.togglePage.bind(this)
    this.completeQuest = this.completeQuest.bind(this)
  }

  async componentWillMount() {

  }

  populateSelectedReqs(){
    return (
      Object.keys(nfts.Main).map((key, i)=> {
        if(this.state.selectedReqs.has(key)){
          return(
            <div className="createRow" key={i}>
              <SelectedReqItem 
                name={nfts.Main[key].name}
                remove={this.remove}
                itemKey = {key}
                key ={key}
                />
            </div>
          )
      }})
    )
  }

  updateSelectedPrize(key){
    this.setState({
      selectedPrize : key,
      prizeError : false
    })
    if(nfts.Main.hasOwnProperty(key)){
      this.setState({
        amount : 1,
        nftSelected : true,
        amtError : false
      })
    } else {
      this.setState({
        nftSelected : false
      })
    }
  }

  displayPrizes(){
    let allTokens = {};
    for (let item in nfts.Main){
      allTokens[item] = nfts[item]
    }
    for (let item in erc20s.Main){
      allTokens[item] = erc20s[item]
    }
    return (
      Object.entries(allTokens).map((item)=>{
        return (
          <div 
            className={this.state.selectedPrize === item[0] ? "prizeCard prizeCardSelected" : "prizeCard"} 
            key={item[0]} 
            onClick={(event)=>{this.updateSelectedPrize(item[0])}}
          >
            <p className="prizeTokenTicker">{item[0]}</p>
            <img alt={''} src={cat} id="prizePic" />
          </div>
        )
      })
    )
  }

  add(key){
    const old = this.state.selectedReqs;
    const newSet = old.add(key)
    this.setState({
      selectedReqs : newSet
    })
  }

  remove(key){
    const old = this.state.selectedReqs;
    old.delete(key)
    this.setState({
      selectedReqs : old
    })
  }

  handleNextPage(){

  }

  validatePageOne() {
    //reset the state
    this.setState({
      titleError : false,
      reqError : false
    })
    let valid = true
    if (this.state.selectedReqs.size === 0){
      this.setState({
        reqError : true
      })
      valid = false
    }
    if(this.state.title===''){
      this.setState({
        titleError : true
      })
      valid = false
    }
    return valid
  }

  validatePageTwo(){
    let valid = true;
    this.setState({
      prizeError : false,
      amtError : false
    })
    if(this.state.selectedPrize === ''){
      this.setState({
        prizeError : true
      })
      valid = false;
    }
    if(this.state.amount < 1){
      this.setState({
        amtError : true
      })
      valid = false;
    }
    return valid
  }

  togglePage(){
      if(this.state.step===1 ){
        if(this.validatePageOne()){
          this.setState({
            step : 2
          })
        }
      } else {
        this.setState({
          step : 1
        })
      }
    
  }

  completeQuest(){
    if(this.validatePageTwo()){
      alert("Quest created")
    }
  }

  selectPage() {
    if(this.state.step === 1){
      return (
        <div className="createPage">
          <div className="headerTextCreate">
            <h6 style={{marginRight:"10px"}}>Create New Quest</h6>
            <h3>Step {this.state.step} of 2</h3>
          </div>
          <div className="createCard">
            {this.state.titleError ? <h3 className="errorText" id="titleError">Title must not be empty!</h3> : ''}   
            <div className="createRow">
              <h3>Quest Title</h3>
              <input 
                className="createInput" 
                id="titleInput" 
                onChange={(event) => {this.setState({title : event.target.value})}}
                value={this.state.title}
              />
            </div>
          </div>
          <div className="createCard" id="reqSelect">
          {this.state.reqError ? <h3 className="errorText" id="reqError">You must select at least 1 requirement!</h3> : ''}   
            <div className="createRow">
              <h3 style={{marginBottom:'20px'}}>Quest Requirements</h3>
            </div>
              {this.populateSelectedReqs()}
            <div className="createRow">
              <DropDownList add={this.add} />
            </div>
            <hr id="createRule"/>
            <p className="bottomText">Users must submit each item in order to complete the quest.</p>
          </div>

          <div className="submitWrapper">
            <div className="pageSubmit" id="page1Submit" onClick={this.togglePage}>
              <h6 className="whiteText">Next Page</h6>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="createPage">
          <div className="headerTextCreate">
            <div className="" onClick={this.togglePage} id="previousButton">
              <h4 className="">{'<- Previous'}</h4>
            </div>
            <h6 style={{marginRight:"20px"}}>Create New Quest</h6>
            <h3>Step {this.state.step} of 2</h3>
          </div>
          <div className="prizeSelection">
            {this.state.prizeError ? <h3 className="errorText" id="prizeSelectError">You must select a prize.</h3> : ''}
            <h6>Insert Prize</h6>
            <p className="bottomText">When you select your prize, it will be hed in escrow while the quest is open.</p>
            <div className="prizeGrid">
              {this.displayPrizes()}
            </div>
            {erc20s.Main.hasOwnProperty(this.state.selectedPrize) ? 
              <div className="amountRow">
                {this.state.amtError ? <h3 className="errorText" id="amtError">You must enter an amount great than 0.</h3> : ''}
                <h4 style={{marginRight:"20px"}}>Amount</h4>
                <input 
                  className="createInput" 
                  value={this.state.amount}
                  type="text" 
                  onKeyUp={(event)=>{this.setState({amount : event.target.value.replace(/[^\d]+/, '')})}}
                  onChange={(event)=>{this.setState({amount : event.target.value})}}
                />
              </div> 
            : ''}
          </div>
          <div className="submitWrapper">
            <div className="pageSubmit" onClick={this.completeQuest} id="page2Submit">
              <h6 className="whiteText">Complete</h6>
            </div>
          </div>
        </div>
      )
    }
  }

  render() {
    return (
      this.selectPage()
    );
  }
}

export default Create;