import { Chain } from '../core/chain';

export class AnyChain extends Chain<any> {
  protected isNil(value: unknown): boolean {
    return value === undefined || value === null;
  }

  protected typeCheck(value: unknown): value is any {
    return true;
  }

  protected typeName(): string {
    return 'any';
  }
}
