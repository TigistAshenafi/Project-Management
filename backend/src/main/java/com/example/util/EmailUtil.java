package com.example.util;

import javax.mail.*;
import javax.mail.internet.*;
import java.util.Properties;

public class EmailUtil {
    public static void sendInvitationEmail(String recipientEmail, String invitationLink) {
        String from = "pms.system.dbu@gmail.com";
        String host = "smtp.gmail.com"; // Replace with your SMTP server

        Properties properties = System.getProperties();
        properties.setProperty("mail.smtp.host", host);
        properties.setProperty("mail.smtp.port", "587"); // Or 465 for SSL
        properties.setProperty("mail.smtp.auth", "true");
        properties.setProperty("mail.smtp.starttls.enable", "true"); // <--- REQUIRED

        Session session = Session.getDefaultInstance(properties, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication("pms.system.dbu@gmail.com", "cwuu fwos vavb lnqe"); // Use App Password if 2FA enabled
            }
        });

        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(from));
            message.addRecipient(Message.RecipientType.TO, new InternetAddress(recipientEmail));
            message.setSubject("You're Invited!");
            message.setText("Click the link to join: " + invitationLink);

            Transport.send(message);
            System.out.println("Invitation sent successfully...");
        } catch (MessagingException mex) {
            mex.printStackTrace();
        }
    }

    public static void sendTaskAssignmentEmail(String recipientEmail, String taskTitle, String projectName, String dueDate) {
        String from = "pms.system.dbu@gmail.com";
        String host = "smtp.gmail.com";

        Properties properties = System.getProperties();
        properties.setProperty("mail.smtp.host", host);
        properties.setProperty("mail.smtp.port", "587");
        properties.setProperty("mail.smtp.auth", "true");
        properties.setProperty("mail.smtp.starttls.enable", "true");

        Session session = Session.getDefaultInstance(properties, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication("pms.system.dbu@gmail.com", "cwuu fwos vavb lnqe");
            }
        });

        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(from));
            message.addRecipient(Message.RecipientType.TO, new InternetAddress(recipientEmail));
            message.setSubject("New Task Assigned: " + taskTitle);

            StringBuilder body = new StringBuilder();
            body.append("You have been assigned a new task.\n\n");
            body.append("Task: ").append(taskTitle == null ? "(no title)" : taskTitle).append("\n");
            if (projectName != null && !projectName.isEmpty()) {
                body.append("Project: ").append(projectName).append("\n");
            }
            if (dueDate != null && !dueDate.isEmpty()) {
                body.append("Due Date: ").append(dueDate).append("\n");
            }
            body.append("\nPlease log in to view details.");

            message.setText(body.toString());

            Transport.send(message);
            System.out.println("Task assignment email sent successfully...");
        } catch (MessagingException mex) {
            mex.printStackTrace();
        }
    }
}