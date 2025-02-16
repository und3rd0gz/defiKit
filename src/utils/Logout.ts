import chalk from 'chalk';

export default class Logout {
  private static filter(text: string[]) {
    if (text.find((s) => `${s}`.indexOf(process.env.FILTER) !== -1)) {
      return true;
    }

    return false;
  }

  public static green(...text: string[]) {
    if (!this.filter(text)) {
      return;
    }

    console.log(chalk.green(...text));
  }

  public static red(...text: string[]) {
    if (!this.filter(text)) {
      return;
    }

    console.log(chalk.red(...text));
  }

  public static yellow(...text: string[]) {
    if (!this.filter(text)) {
      return;
    }

    console.log(chalk.yellow(...text));
  }

  public static white(...text: string[]) {
    if (!this.filter(text)) {
      return;
    }

    console.log(...text);
  }

  public static greenAccent(description, accent) {
    if (!this.filter([description, accent])) {
      return;
    }

    console.log(`${description} ${chalk.green(accent)}`);
  }

  public static yellowAccent(description, accent) {
    if (!this.filter([description, accent])) {
      return;
    }

    console.log(`${description} ${chalk.yellow(accent)}`);
  }

  public static redAccent(description, accent) {
    if (!this.filter([description, accent])) {
      return;
    }

    console.log(`${description} ${chalk.red(accent)}`);
  }

  public static getPurple(...text) {
    return chalk.ansi(35).visible(text);
  }
}
