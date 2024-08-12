import { LCDClient } from './lcd/LCDClient'
import { Wallet } from './lcd/Wallet'
import { MnemonicKey } from '../key/MnemonicKey'

const LOCALINITIA_MNEMONICS = {
  validator:
    'walk only potato reason dance meadow any milk raise inflict retreat parent force resource battle concert acquire regret drill better cabin meadow ordinary save',
  test1:
    'exclude stay club ten scrap inflict wheat riot fly usage wait dog grain turtle fetch toy insect snap mimic inner juice hotel grant net',
  test2:
    'explain inch inherit clean poverty crime guess material element arm night demand stem kid pool large hour soul measure scan pave error weather tragic',
  test3:
    'coconut climb noble cupboard leader decide power apple twice fiber blue region present orient negative jungle blanket fat gym moon fossil bulb evil apart',
  test4:
    'topic visual tide critic march unhappy thrive permit load math artwork speed only lawn effort general under cable door relief liberty avocado swallow tenant',
  test5:
    'large smoke slam staff crisp any version olympic spatial broom forward detect notice pull option hundred private outdoor oven hint box interest into power',
  test6:
    'private fuel exile give tribe profit waste sight primary fish rookie skirt wear broom issue gold bird process once pattern tongue rival sense reject',
  test7:
    'segment hire punch same escape soap economy health what either flat diamond hammer auction index omit museum tuition decline weekend lava over time mango',
  test8:
    'churn hill piece army zero random breeze ginger magnet huge fat notable ceiling yellow security chalk merry normal junior warm theme false fade later',
  test9:
    'primary scale invite wife carpet roast blouse utility lyrics tank marriage science problem salmon minor grocery there ladder noise never gather aerobic neglect rigid',
  test10:
    'forum shiver flush artefact analyst undo hundred mixed diamond mushroom submit city march crater fatigue deal host asthma reopen barrel virtual accuse crime dune',
}

export class LocalInitia extends LCDClient {
  public wallets: {
    validator: Wallet
    test1: Wallet
    test2: Wallet
    test3: Wallet
    test4: Wallet
    test5: Wallet
    test6: Wallet
    test7: Wallet
    test8: Wallet
    test9: Wallet
    test10: Wallet
  }

  constructor() {
    super('http://localhost:1317', { chainId: 'local-initia' })

    this.wallets = {
      validator: this.wallet(
        new MnemonicKey({ mnemonic: LOCALINITIA_MNEMONICS.validator })
      ),
      test1: this.wallet(
        new MnemonicKey({ mnemonic: LOCALINITIA_MNEMONICS.test1 })
      ),
      test2: this.wallet(
        new MnemonicKey({ mnemonic: LOCALINITIA_MNEMONICS.test2 })
      ),
      test3: this.wallet(
        new MnemonicKey({ mnemonic: LOCALINITIA_MNEMONICS.test3 })
      ),
      test4: this.wallet(
        new MnemonicKey({ mnemonic: LOCALINITIA_MNEMONICS.test4 })
      ),
      test5: this.wallet(
        new MnemonicKey({ mnemonic: LOCALINITIA_MNEMONICS.test5 })
      ),
      test6: this.wallet(
        new MnemonicKey({ mnemonic: LOCALINITIA_MNEMONICS.test6 })
      ),
      test7: this.wallet(
        new MnemonicKey({ mnemonic: LOCALINITIA_MNEMONICS.test7 })
      ),
      test8: this.wallet(
        new MnemonicKey({ mnemonic: LOCALINITIA_MNEMONICS.test8 })
      ),
      test9: this.wallet(
        new MnemonicKey({ mnemonic: LOCALINITIA_MNEMONICS.test9 })
      ),
      test10: this.wallet(
        new MnemonicKey({ mnemonic: LOCALINITIA_MNEMONICS.test10 })
      ),
    }
  }
}
