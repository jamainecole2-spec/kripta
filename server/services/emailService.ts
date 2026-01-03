import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface OrderConfirmationData {
  userName: string;
  orderType: "buy" | "sell";
  cryptocurrency: string;
  amount: number;
  price: number;
  total: number;
  orderId: string;
  timestamp: Date;
}

interface PriceAlertData {
  userName: string;
  cryptocurrency: string;
  currentPrice: number;
  alertPrice: number;
  direction: "above" | "below";
}

interface DepositConfirmationData {
  userName: string;
  cryptocurrency: string;
  amount: number;
  transactionId: string;
  timestamp: Date;
}

interface WithdrawalConfirmationData {
  userName: string;
  cryptocurrency: string;
  amount: number;
  address: string;
  transactionId: string;
  timestamp: Date;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // For development/testing, use Ethereal Email (fake SMTP service)
    // For production, configure with your actual email provider
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      // Development: use test account
      this.transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: "test@example.com",
          pass: "test123",
        },
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.warn("[Email] Transporter not initialized");
        return false;
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || "noreply@kripta.exchange",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || "",
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("[Email] Message sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("[Email] Failed to send email:", error);
      return false;
    }
  }

  async sendOrderConfirmation(email: string, data: OrderConfirmationData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Order Confirmation</h2>
        <p>Hi ${data.userName},</p>
        <p>Your ${data.orderType.toUpperCase()} order has been confirmed!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order Details:</strong></p>
          <p>Order ID: ${data.orderId}</p>
          <p>Type: ${data.orderType === "buy" ? "BUY" : "SELL"}</p>
          <p>Cryptocurrency: ${data.cryptocurrency}</p>
          <p>Amount: ${data.amount} ${data.cryptocurrency}</p>
          <p>Price: $${data.price.toFixed(2)}</p>
          <p><strong>Total: $${data.total.toFixed(2)}</strong></p>
          <p>Time: ${data.timestamp.toLocaleString()}</p>
        </div>
        
        <p>Your order is now active on the Kripta Asset Exchange.</p>
        <p>Best regards,<br/>Kripta Asset Exchange Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Order Confirmation - ${data.orderType.toUpperCase()} ${data.cryptocurrency}`,
      html,
    });
  }

  async sendPriceAlert(email: string, data: PriceAlertData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Price Alert - ${data.cryptocurrency}</h2>
        <p>Hi ${data.userName},</p>
        <p>${data.cryptocurrency} has moved ${data.direction} your alert price!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Alert Details:</strong></p>
          <p>Cryptocurrency: ${data.cryptocurrency}</p>
          <p>Current Price: $${data.currentPrice.toFixed(2)}</p>
          <p>Alert Price: $${data.alertPrice.toFixed(2)}</p>
          <p>Direction: Price went ${data.direction} your alert</p>
        </div>
        
        <p><a href="https://kripta.exchange/trading" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Open Trading</a></p>
        <p>Best regards,<br/>Kripta Asset Exchange Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Price Alert: ${data.cryptocurrency} is now $${data.currentPrice.toFixed(2)}`,
      html,
    });
  }

  async sendDepositConfirmation(email: string, data: DepositConfirmationData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Deposit Confirmed</h2>
        <p>Hi ${data.userName},</p>
        <p>Your deposit has been successfully received!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Deposit Details:</strong></p>
          <p>Transaction ID: ${data.transactionId}</p>
          <p>Cryptocurrency: ${data.cryptocurrency}</p>
          <p>Amount: ${data.amount} ${data.cryptocurrency}</p>
          <p>Date: ${data.timestamp.toLocaleString()}</p>
        </div>
        
        <p>The funds are now available in your wallet.</p>
        <p>Best regards,<br/>Kripta Asset Exchange Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Deposit Confirmed - ${data.amount} ${data.cryptocurrency}`,
      html,
    });
  }

  async sendWithdrawalConfirmation(email: string, data: WithdrawalConfirmationData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Withdrawal Initiated</h2>
        <p>Hi ${data.userName},</p>
        <p>Your withdrawal has been initiated and is being processed.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Withdrawal Details:</strong></p>
          <p>Transaction ID: ${data.transactionId}</p>
          <p>Cryptocurrency: ${data.cryptocurrency}</p>
          <p>Amount: ${data.amount} ${data.cryptocurrency}</p>
          <p>Destination Address: ${data.address.substring(0, 10)}...${data.address.substring(data.address.length - 10)}</p>
          <p>Date: ${data.timestamp.toLocaleString()}</p>
        </div>
        
        <p>You will receive another email once the withdrawal is confirmed on the blockchain.</p>
        <p>Best regards,<br/>Kripta Asset Exchange Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Withdrawal Initiated - ${data.amount} ${data.cryptocurrency}`,
      html,
    });
  }

  async sendSecurityAlert(email: string, message: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Security Alert</h2>
        <p>We detected unusual activity on your Kripta account.</p>
        
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p>${message}</p>
        </div>
        
        <p>If this wasn't you, please change your password immediately and enable two-factor authentication.</p>
        <p><a href="https://kripta.exchange/settings/security" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Update Security Settings</a></p>
        <p>Best regards,<br/>Kripta Asset Exchange Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: "Security Alert - Unusual Activity Detected",
      html,
    });
  }
}

export default new EmailService();
