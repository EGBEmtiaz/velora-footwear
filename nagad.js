export class NagadService {
 constructor(env){this.enabled=Boolean(env.NAGAD_MERCHANT_ID&&env.NAGAD_MERCHANT_PRIVATE_KEY_PATH&&env.NAGAD_NAGAD_PUBLIC_KEY_PATH);}
 async create(){if(!this.enabled){const e=new Error("Nagad merchant credentials and RSA keys are not configured.");e.code="NAGAD_NOT_CONFIGURED";throw e;}const e=new Error("Nagad production adapter requires the merchant-specific approved RSA integration package/parameters.");e.code="NAGAD_INTEGRATION_REQUIRED";throw e;}
}